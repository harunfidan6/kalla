import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from './jwt-payload.interface';
import { Role } from '@kafe/shared-types';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      return null;
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Çok fazla hatalı deneme nedeniyle hesap kilitlendi. Lütfen ${minutesLeft} dakika sonra tekrar deneyin.`,
      );
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!passwordMatches) {
      const attempts = user.failedLoginAttempts + 1;
      if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
        });
        throw new UnauthorizedException('Çok fazla hatalı deneme nedeniyle hesap 15 dakika süreyle kilitlendi.');
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts },
      });
      throw new UnauthorizedException(
        `E-posta veya şifre hatalı. Kalan deneme hakkı: ${MAX_FAILED_LOGIN_ATTEMPTS - attempts}`,
      );
    }

    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null },
      });
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any, meta?: { ipAddress?: string; userAgent?: string }) {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
      branchId: user.branchId,
      type: 'access',
      jti: crypto.randomUUID(),
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
      branchId: user.branchId,
      type: 'refresh',
      jti: crypto.randomUUID(),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh token to database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName,
        branchId: user.branchId || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        customerProfile: user.customerProfile || null,
        staffProfile: user.staffProfile || null,
      },
    };
  }

  async register(registerDto: RegisterDto, meta?: { ipAddress?: string; userAgent?: string }) {
    if (!registerDto.kvkkAccepted) {
      throw new BadRequestException('Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni onayı olmadan kayıt olunamaz.');
    }
    const user = await this.usersService.create(registerDto, Role.CUSTOMER);
    return this.login(user, meta);
  }

  async registerStaff(createStaffDto: CreateStaffDto, meta?: { ipAddress?: string; userAgent?: string }) {
    const user = await this.usersService.create(createStaffDto, createStaffDto.role);
    return this.login(user, meta);
  }

  async refresh(token: string, meta?: { ipAddress?: string; userAgent?: string }) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Geçersiz token tipi');
      }

      const tokenHash = this.hashToken(token);
      const dbToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: { include: { customerProfile: true, staffProfile: true } } },
      });

      if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Geçersiz veya süresi geçmiş refresh token');
      }

      // Rotation: Revoke old token and generate new ones
      await this.prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date() },
      });

      return this.login(dbToken.user, meta);
    } catch (e) {
      throw new UnauthorizedException(e.message || 'Geçersiz veya süresi geçmiş refresh token');
    }
  }

  async logout(token: string) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    try {
      const payload = this.jwtService.decode(token) as JwtPayload;
      if (payload && payload.sub) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: payload.sub, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch (e) {
      // Ignore errors during logout
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { success: true, message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.' };
    }

    // Rastgele, DB'de izlenen tek kullanımlık jeton — stateless JWT'nin aksine kullanıldığı
    // anda silinir, süresi dolana kadar tekrar tekrar kullanılamaz.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordReset.deleteMany({ where: { email: user.email } });
    await this.prisma.passwordReset.create({
      data: { email: user.email, tokenHash, expiresAt },
    });

    console.log(`\n📧 [EMAIL SIMULATION] Sent password reset link to ${user.email}:`);
    console.log(`👉 Link: http://localhost:8081/reset-password?token=${rawToken}\n`);

    return {
      success: true,
      message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.',
      token: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const resetRecord = await this.prisma.passwordReset.findUnique({ where: { tokenHash } });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş şifre sıfırlama jetonu.');
    }

    const user = await this.usersService.findByEmail(resetRecord.email);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, failedLoginAttempts: 0, lockoutUntil: null },
    });

    // Tek kullanımlık: kullanılan jeton hemen silinir, tekrar kullanılamaz.
    await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' };
  }
}
