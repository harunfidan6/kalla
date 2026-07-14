import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request, Res, Query, HttpCode, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { InitializeCheckoutDto } from './dto/initialize-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Yeni bir sipariş oluşturur' })
  @ApiResponse({ status: 201, description: 'Sipariş başarıyla oluşturuldu.' })
  @ApiResponse({ status: 400, description: 'Hatalı sepet veya sipariş verisi.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Tüm aktif siparişleri listeler (Personel ekranı için)' })
  @ApiResponse({ status: 200, description: 'Aktif siparişler listelendi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async getActiveOrders(@Request() req: any) {
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar sipariş panosunu görüntüleyemez');
    }
    return this.ordersService.findAllActiveOrders(req.user.branchId);
  }

  @Get('cancelled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Son 24 saatte iptal edilmiş siparişleri listeler (Personel ekranı için)' })
  @ApiResponse({ status: 200, description: 'İptal edilen siparişler listelendi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async getCancelledOrders(@Request() req: any) {
    if (!req.user.branchId) {
      throw new BadRequestException('Şube ataması olmayan kullanıcılar iptal geçmişini görüntüleyemez');
    }
    return this.ordersService.findRecentCancelled(req.user.branchId);
  }

  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mevcut giriş yapan kullanıcının tüm sipariş geçmişini listeler' })
  @ApiResponse({ status: 200, description: 'Sipariş geçmişi başarıyla getirildi.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async getMyOrders(@Request() req: any) {
    return this.ordersService.findAllMyOrders(req.user.id);
  }

  // P2: InitializeCheckoutDto ile tam validasyon ve Swagger şeması
  @Post(':id/checkout-form/initialize')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'iyzico checkout formunu ilklendirir' })
  @ApiResponse({ status: 201, description: 'Ödeme formu başarıyla ilklendirildi.' })
  async initializeCheckoutForm(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: InitializeCheckoutDto,
  ) {
    return this.ordersService.initializeCheckoutForm(req.user.id, id, body.useWallet, body.walletAmount);
  }

  // P1 Fix: Callback URL artık process.env.API_BASE_URL'den okunuyor (hardcoded localhost kaldırıldı)
  // encodeURIComponent ile token URL'e güvenli encode ediliyor
  @Post('checkout-form/callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'iyzico checkout form geri çağırma (callback) uç noktası' })
  async checkoutFormCallback(@Body('token') token: string, @Res() res: any) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    return res.redirect(`${baseUrl}/orders/checkout-form/success?token=${encodeURIComponent(token)}`);
  }

  // P0-1 Fix: Reflected XSS kapatıldı
  // - token JSON.stringify ile güvenli JS string'ine dönüştürülüyor
  // - postMessage artık '*' değil, APP_ORIGIN env'den okunan gerçek origin kullanıyor
  @Get('checkout-form/success')
  @ApiOperation({ summary: 'Ödeme başarılı sayfası' })
  async checkoutFormSuccessPage(@Query('token') token: string) {
    const safeTokenJson = JSON.stringify(token ?? '');
    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:8081';

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; background-color: #0f1811; color: #87A99C; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { font-size: 14px; color: rgba(255,255,255,0.7); }
          </style>
        </head>
        <body>
          <h1>Ödeme Tamamlandı ☕</h1>
          <p>Uygulamaya dönülüyor...</p>
          <script>
            var payload = { type: 'IYZICO_SUCCESS', token: ${safeTokenJson} };
            if (window.opener) window.opener.postMessage(payload, '${appOrigin}');
            if (window.parent) window.parent.postMessage(payload, '${appOrigin}');
          </script>
        </body>
      </html>
    `;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Belirli bir siparişin detaylarını getirir' })
  @ApiResponse({ status: 200, description: 'Sipariş detayları.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  @ApiResponse({ status: 404, description: 'Sipariş bulunamadı.' })
  async getOrderById(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.id, id, req.user.role);
  }

  // BUG-1 Fix: Eksik olan /cancel endpoint eklendi
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Siparişi iptal eder (müşteri kendi siparişini, admin herkesinkini iptal edebilir)' })
  @ApiResponse({ status: 200, description: 'Sipariş iptal edildi.' })
  @ApiResponse({ status: 403, description: 'Başkasının siparişi iptal edilemez.' })
  @ApiResponse({ status: 404, description: 'Sipariş bulunamadı.' })
  async cancelOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.id, id, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Sipariş durumunu günceller (Personel ekranı için)' })
  @ApiResponse({ status: 200, description: 'Sipariş durumu güncellendi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz durum veya eksik ödeme yöntemi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status, req.user.id, body.paymentMethod);
  }

  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Siparişi cüzdan bakiyesi ve/veya iyzico kart ödemesi ile tamamlar' })
  @ApiResponse({ status: 201, description: 'Ödeme başarıyla işlendi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz ödeme veya bakiye hatası.' })
  async checkout(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: CheckoutOrderDto,
  ) {
    return this.ordersService.checkout(req.user.id, id, body);
  }
}
