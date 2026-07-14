import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { ProcessChangeRequestDto } from './dto/process-change-request.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { ShiftChangeRequestStatus, ShiftStatus } from '@kafe/shared-types';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async findMyShifts(userId: string) {
    return this.prisma.shift.findMany({
      where: { staffId: userId },
      include: {
        changeRequests: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findTeamShifts(weekStart: string, branchId: string) {
    const start = new Date(`${weekStart}T00:00:00`);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('weekStart YYYY-MM-DD formatında olmalıdır');
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.prisma.shift.findMany({
      where: {
        branchId,
        startTime: { gte: start, lt: end },
        status: { not: ShiftStatus.CANCELLED },
      },
      include: {
        staff: { select: { id: true, fullName: true, role: true } },
        changeRequests: { select: { id: true, status: true, requestedBy: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  // Admin app'in Vardiya Ekle özelliği — personelin kendi şubesine damgalanmış bir vardiya
  // oluşturur. Bir personelin vardiyaları her zaman o an atanmış olduğu şubeye aittir.
  async createShift(dto: CreateShiftDto) {
    const staff = await this.prisma.user.findUnique({ where: { id: dto.staffId } });
    if (!staff) {
      throw new NotFoundException('Personel bulunamadı');
    }
    if (!staff.branchId) {
      throw new BadRequestException('Bu personele henüz bir şube atanmamış — önce Personel ekranından şube atayın');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (endTime <= startTime) {
      throw new BadRequestException('Bitiş saati başlangıç saatinden sonra olmalıdır');
    }

    return this.prisma.shift.create({
      data: {
        staffId: dto.staffId,
        branchId: staff.branchId,
        startTime,
        endTime,
        status: ShiftStatus.SCHEDULED,
      },
      include: {
        staff: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async createChangeRequest(userId: string, dto: CreateChangeRequestDto) {
    const { shiftId, reason } = dto;

    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { changeRequests: true },
    });

    if (!shift) {
      throw new NotFoundException('Vardiya bulunamadı');
    }

    if (shift.staffId !== userId) {
      throw new BadRequestException('Bu vardiya size ait değil');
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException('Sadece planlanmış aktif vardiyalar için değişim talep edilebilir');
    }

    // Check for existing pending request
    const hasPending = shift.changeRequests.some(
      (r) => r.status === ShiftChangeRequestStatus.PENDING
    );
    if (hasPending) {
      throw new BadRequestException('Bu vardiya için zaten açıkta olan bir değişim talebi bulunuyor');
    }

    return this.prisma.shiftChangeRequest.create({
      data: {
        shiftId,
        requestedBy: userId,
        reason,
        status: ShiftChangeRequestStatus.PENDING,
      },
    });
  }

  async findPendingRequests(branchId: string) {
    return this.prisma.shiftChangeRequest.findMany({
      where: { status: ShiftChangeRequestStatus.PENDING, shift: { branchId } },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        shift: {
          include: {
            staff: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { shift: { startTime: 'asc' } },
    });
  }

  async processChangeRequest(requestId: string, dto: ProcessChangeRequestDto) {
    const { status } = dto;

    const request = await this.prisma.shiftChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Vardiya değişim talebi bulunamadı');
    }

    if (request.status !== ShiftChangeRequestStatus.PENDING) {
      throw new BadRequestException('Bu talep zaten karara bağlanmış');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedRequest = await tx.shiftChangeRequest.update({
        where: { id: requestId },
        data: { status },
      });

      // 2. If approved, mark the shift as cancelled
      if (status === ShiftChangeRequestStatus.APPROVED) {
        await tx.shift.update({
          where: { id: request.shiftId },
          data: { status: ShiftStatus.CANCELLED },
        });
      }

      return updatedRequest;
    });
  }
}
