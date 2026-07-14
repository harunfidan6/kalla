import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@kafe/shared-types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(registerDto: RegisterDto, role: Role = Role.CUSTOMER) {
    const { email, phone, password, fullName, position, employeeCode, birthday } = registerDto;

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('Bu e-posta adresi zaten kullanımda');
    }

    // Check if phone already exists
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw new ConflictException('Bu telefon numarası zaten kullanımda');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Use Prisma transaction to create user and profile
    return this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: role as any, // Cast to Prisma enum type
          fullName,
        },
      });

      // 2. Create Profile based on Role
      if (role === Role.CUSTOMER) {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
            loyaltyPoints: 0,
            totalSpent: 0.0,
            birthday: birthday ? new Date(birthday) : null,
          },
        });
        await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
          },
        });
      } else {
        // Staff, Shift Lead, Admin profiles
        const finalEmployeeCode = employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const finalPosition = position || (role === Role.ADMIN ? 'Administrator' : 'Barista');

        // Check if employee code already exists
        const existingEmpCode = await tx.staffProfile.findUnique({
          where: { employeeCode: finalEmployeeCode },
        });
        if (existingEmpCode) {
          throw new ConflictException('Bu personel kodu zaten kullanımda');
        }

        await tx.staffProfile.create({
          data: {
            userId: user.id,
            position: finalPosition,
            employeeCode: finalEmployeeCode,
            hireDate: new Date(),
          },
        });
      }

      // Return user with profiles but without password hash
      const fullUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          customerProfile: true,
          staffProfile: true,
        },
      });
      const { passwordHash: _, ...result } = fullUser!;
      return result;
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        staffProfile: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        staffProfile: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: { ...dto, userId },
    });
  }

  private async findOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) {
      throw new NotFoundException('Adres bulunamadı');
    }
    if (address.userId !== userId) {
      throw new UnauthorizedException('Bu adres üzerinde işlem yapamazsınız');
    }
    return address;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.findOwnedAddress(userId, addressId);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    await this.findOwnedAddress(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }

  // Admin app'in Personel Atama ekranı için — tüm tezgah personelini (Staff/Shift Lead) ve
  // mevcut şube atamalarını listeler.
  async listStaff() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.STAFF, Role.SHIFT_LEAD] } },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        staffProfile: { select: { position: true, employeeCode: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async assignBranch(userId: string, branchId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    if (user.role !== Role.STAFF && user.role !== Role.SHIFT_LEAD) {
      throw new UnauthorizedException('Şube ataması yalnızca personel hesaplarına yapılabilir');
    }
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Şube bulunamadı');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { branchId },
      select: { id: true, fullName: true, branchId: true, branch: { select: { id: true, name: true } } },
    });
  }
}
