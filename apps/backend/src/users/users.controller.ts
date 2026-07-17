import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users & Addresses')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me/addresses')
  @ApiOperation({ summary: 'Giriş yapan kullanıcının kayıtlı adreslerini listeler' })
  @ApiResponse({ status: 200, description: 'Adresler listelendi.' })
  async list(@Request() req: any) {
    return this.usersService.listAddresses(req.user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Yeni bir adres ekler' })
  @ApiResponse({ status: 201, description: 'Adres oluşturuldu.' })
  async create(@Request() req: any, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(req.user.id, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Kendi adresini günceller' })
  @ApiResponse({ status: 200, description: 'Adres güncellendi.' })
  @ApiResponse({ status: 401, description: 'Başkasının adresi güncellenemez.' })
  @ApiResponse({ status: 404, description: 'Adres bulunamadı.' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.usersService.updateAddress(req.user.id, id, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Kendi adresini siler' })
  @ApiResponse({ status: 200, description: 'Adres silindi.' })
  @ApiResponse({ status: 401, description: 'Başkasının adresi silinemez.' })
  @ApiResponse({ status: 404, description: 'Adres bulunamadı.' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.usersService.deleteAddress(req.user.id, id);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Hesabı siler — kişisel tanımlayıcı veriler kalıcı silinir, geçmiş sipariş/fatura kayıtları KVKK/VUK gereği anonimleştirilerek korunur' })
  @ApiResponse({ status: 200, description: 'Hesap silindi.' })
  async deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.id);
  }
}
