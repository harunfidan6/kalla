import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AssignBranchDto } from './dto/assign-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users & Addresses')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private usersService: UsersService) {}

  @Get('staff')
  @ApiOperation({ summary: 'Tüm personeli (Staff/Shift Lead) ve şube atamalarını listeler (Admin yetkili)' })
  @ApiResponse({ status: 200, description: 'Personel listelendi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  async listStaff() {
    return this.usersService.listStaff();
  }

  @Patch(':id/branch')
  @ApiOperation({ summary: 'Bir personeli bir şubeye atar (Admin yetkili)' })
  @ApiResponse({ status: 200, description: 'Şube ataması güncellendi.' })
  @ApiResponse({ status: 403, description: 'Yetkisiz rol.' })
  @ApiResponse({ status: 404, description: 'Kullanıcı veya şube bulunamadı.' })
  async assignBranch(@Param('id') id: string, @Body() dto: AssignBranchDto) {
    return this.usersService.assignBranch(id, dto.branchId);
  }
}
