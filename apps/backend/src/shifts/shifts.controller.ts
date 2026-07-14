import { Controller, Post, Body, Get, Param, Patch, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { ProcessChangeRequestDto } from './dto/process-change-request.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Shifts & Vardiyalar')
@Controller('shifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Giriş yapan personelin kendi vardiyalarını listeler' })
  @ApiResponse({ status: 200, description: 'Vardiyalar getirildi.' })
  async getMyShifts(@Request() req: any) {
    return this.shiftsService.findMyShifts(req.user.id);
  }

  @Get('team')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Belirtilen haftada bir şubenin ekip vardiyalarını listeler (personel yalnızca kendi şubesini görür)' })
  @ApiResponse({ status: 200, description: 'Ekip vardiyaları getirildi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz weekStart parametresi veya şube ataması yok.' })
  async getTeamShifts(@Request() req: any, @Query('weekStart') weekStart: string, @Query('branchId') branchId?: string) {
    // Admin farklı şubeleri görüntüleyebilir; Staff/Shift Lead her zaman kendi şubesiyle sınırlıdır.
    const effectiveBranchId = req.user.role === Role.ADMIN ? branchId : req.user.branchId;
    if (!effectiveBranchId) {
      throw new BadRequestException('Görüntülenecek bir şube belirtilmedi');
    }
    return this.shiftsService.findTeamShifts(weekStart, effectiveBranchId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bir personele yeni vardiya atar (Admin yetkili)' })
  @ApiResponse({ status: 201, description: 'Vardiya oluşturuldu.' })
  @ApiResponse({ status: 400, description: 'Geçersiz vardiya parametreleri veya personele şube atanmamış.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  @ApiResponse({ status: 404, description: 'Personel bulunamadı.' })
  async createShift(@Body() dto: CreateShiftDto) {
    return this.shiftsService.createShift(dto);
  }

  @Post('change-request')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Bir vardiya için değişim talebi oluşturur' })
  @ApiResponse({ status: 201, description: 'Değişim talebi oluşturuldu.' })
  @ApiResponse({ status: 400, description: 'Geçersiz talep parametreleri.' })
  async createChangeRequest(@Request() req: any, @Body() dto: CreateChangeRequestDto) {
    return this.shiftsService.createChangeRequest(req.user.id, dto);
  }

  @Get('change-requests/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Onay bekleyen tüm vardiya değişim taleplerini listeler (Yönetici yetkili)' })
  @ApiResponse({ status: 200, description: 'Talepler listelendi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async getPendingRequests(@Request() req: any) {
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar bekleyen talepleri görüntüleyemez');
    }
    return this.shiftsService.findPendingRequests(req.user.branchId);
  }

  @Patch('change-request/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Bir vardiya değişim talebini onaylar veya reddeder (Yönetici yetkili)' })
  @ApiResponse({ status: 200, description: 'Talep güncellendi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz güncelleme talebi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async processChangeRequest(@Param('id') id: string, @Body() dto: ProcessChangeRequestDto) {
    return this.shiftsService.processChangeRequest(id, dto);
  }
}
