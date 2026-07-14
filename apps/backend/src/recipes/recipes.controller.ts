import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff Recipes')
@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Tüm ürünlerin hazırlanma tariflerini (malzeme, adım, ipucu) listeler' })
  @ApiResponse({ status: 200, description: 'Tarifler listelendi.' })
  async findAll() {
    return this.recipesService.findAll();
  }
}
