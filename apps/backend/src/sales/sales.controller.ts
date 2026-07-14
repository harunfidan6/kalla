import { Controller, Post, Body, Get, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('POS Sales & Z Reports')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Tezgahtan hızlı satış kaydeder (fiyat sunucudan alınır)' })
  @ApiResponse({ status: 201, description: 'Satış kaydedildi.' })
  @ApiResponse({ status: 404, description: 'Ürün bulunamadı veya satışta değil.' })
  async createSale(@Request() req: any, @Body() dto: CreateSaleDto) {
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar satış kaydedemez');
    }
    return this.salesService.createSale(req.user.id, req.user.branchId, dto);
  }

  @Get('today')
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Henüz Z raporuna bağlanmamış açık satışların özetini döner' })
  @ApiResponse({ status: 200, description: 'Günlük satış özeti.' })
  async getToday(@Request() req: any) {
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar kasa özetini görüntüleyemez');
    }
    return this.salesService.getToday(req.user.branchId);
  }

  @Post('close')
  @Roles(Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Günü kapatır ve Z raporu oluşturur (Shift Lead / Admin yetkili)' })
  @ApiResponse({ status: 201, description: 'Z raporu oluşturuldu.' })
  @ApiResponse({ status: 400, description: 'Kapatılacak açık satış yok.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async closeDay(@Request() req: any) {
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar günü kapatamaz');
    }
    return this.salesService.closeDay(req.user.id, req.user.branchId);
  }

  @Get('reports')
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Geçmiş Z raporlarını listeler (Admin çapraz şube, personel yalnızca kendi şubesi)' })
  @ApiResponse({ status: 200, description: 'Z raporları listelendi.' })
  async getReports(@Request() req: any, @Query('branchId') branchId?: string) {
    if (req.user.role === Role.ADMIN) {
      // Admin bir şube seçebilir ya da hiç belirtmeyip tüm şubeleri görebilir.
      return this.salesService.getReports(branchId);
    }
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar Z raporlarını görüntüleyemez');
    }
    return this.salesService.getReports(req.user.branchId);
  }
}
