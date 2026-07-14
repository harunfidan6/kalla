import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm şubeleri listeler' })
  @ApiResponse({ status: 200, description: 'Şubeler listelendi.' })
  async findAll() {
    return this.branchesService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Yeni şube oluşturur (Admin yetkili)' })
  @ApiResponse({ status: 201, description: 'Şube oluşturuldu.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Şube bilgilerini günceller (Admin yetkili)' })
  @ApiResponse({ status: 200, description: 'Şube güncellendi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  @ApiResponse({ status: 404, description: 'Şube bulunamadı.' })
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }
}
