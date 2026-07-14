import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { InitializeTopupDto } from './dto/initialize-topup.dto';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Wallet & Cüzdan Sistemi')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Giriş yapan kullanıcının cüzdan bakiyesini ve işlem geçmişini getirir' })
  @ApiResponse({ status: 200, description: 'Cüzdan bilgileri başarıyla getirildi.' })
  async getMyWallet(@Request() req: any) {
    return this.walletService.getOrCreateWallet(req.user.id);
  }

  // P2: InitializeTopupDto ile tam class-validator ve Swagger şeması
  // @Min(1) ile sıfır ve negatif tutar da engelleniyor
  @Post('topup-form/initialize')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'iyzico checkout formunu cüzdan yükleme işlemi için ilklendirir' })
  @ApiResponse({ status: 201, description: 'Ödeme formu başarıyla ilklendirildi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz tutar.' })
  async initializeTopupForm(@Request() req: any, @Body() dto: InitializeTopupDto) {
    return this.walletService.initializeTopupForm(req.user.id, dto.amount);
  }

  @Post('topup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Kullanıcının cüzdanına iyzico üzerinden bakiye yükler' })
  @ApiResponse({ status: 201, description: 'Bakiye yükleme işlemi başarıyla tamamlandı.' })
  @ApiResponse({ status: 400, description: 'Kart veya ödeme hatası.' })
  async topupWallet(@Request() req: any, @Body() topupDto: TopupWalletDto) {
    return this.walletService.topupWallet(req.user.id, topupDto);
  }

  // P2: AdjustWalletDto ile tam class-validator ve Swagger şeması
  @Post(':userId/adjust')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Yönetici tarafından cüzdan bakiyesini manuel olarak düzenler' })
  @ApiResponse({ status: 201, description: 'Bakiye başarıyla düzenlendi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz parametre veya yetersiz bakiye.' })
  async adjustWallet(
    @Param('userId') userId: string,
    @Body() dto: AdjustWalletDto,
  ) {
    return this.walletService.adjustBalance(userId, dto.amount, dto.reason || 'Admin Düzeltmesi');
  }
}
