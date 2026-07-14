import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Yeni bir müşteri kaydeder' })
  @ApiResponse({ status: 201, description: 'Müşteri başarıyla kaydedildi.' })
  @ApiResponse({ status: 400, description: 'Hatalı istek verileri.' })
  @ApiResponse({ status: 409, description: 'E-posta veya telefon zaten kullanımda.' })
  async register(@Body() registerDto: RegisterDto, @Request() req: any) {
    return this.authService.register(registerDto, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('staff/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni bir personel kaydeder (Yalnızca Admin)' })
  @ApiResponse({ status: 201, description: 'Personel başarıyla kaydedildi.' })
  @ApiResponse({ status: 400, description: 'Hatalı istek verileri.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  @ApiResponse({ status: 403, description: 'Erişim engellendi.' })
  @ApiResponse({ status: 409, description: 'E-posta veya telefon zaten kullanımda.' })
  async registerStaff(@Body() createStaffDto: CreateStaffDto, @Request() req: any) {
    return this.authService.registerStaff(createStaffDto, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı girişi yapar ve JWT tokenlerini döner' })
  @ApiResponse({ status: 200, description: 'Giriş başarılı.' })
  @ApiResponse({ status: 401, description: 'Hatalı kimlik bilgileri.' })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const user = await this.authService.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    return this.authService.login(user, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Süresi dolmuş access tokenı yenilemek için refresh token alır' })
  @ApiResponse({ status: 200, description: 'Yeni tokenler oluşturuldu.' })
  @ApiResponse({ status: 401, description: 'Geçersiz refresh token.' })
  async refresh(@Body('refreshToken') refreshToken: string, @Request() req: any) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token gereklidir');
    }
    return this.authService.refresh(refreshToken, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı çıkışını yapar ve refresh tokenları iptal eder' })
  @ApiResponse({ status: 200, description: 'Çıkış başarılı.' })
  async logout(@Request() req: any) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      await this.authService.logout(authHeader);
    }
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktif giriş yapmış olan kullanıcının bilgilerini döner' })
  @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Şifre sıfırlama talebi oluşturur ve e-posta simülasyonu tetikler' })
  @ApiResponse({ status: 200, description: 'Şifre sıfırlama bağlantısı gönderildi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz e-posta adresi.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Şifre sıfırlama bağlantısındaki token ile şifreyi sıfırlar' })
  @ApiResponse({ status: 200, description: 'Şifre başarıyla güncellendi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
