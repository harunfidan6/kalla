import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { TrainingService } from './training.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@kafe/shared-types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Training & Eğitim Modülü')
@Controller('training')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Mevcut personel için tüm eğitim modüllerini ve tamamlanma durumlarını getirir' })
  @ApiResponse({ status: 200, description: 'Eğitimler listelendi.' })
  async getAllModules(@Request() req: any) {
    return this.trainingService.findAllModules(req.user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Belirli bir eğitim modülünün ve quiz sorularının detaylarını getirir (Cevap anahtarı gizli)' })
  @ApiResponse({ status: 200, description: 'Eğitim modülü detayları.' })
  @ApiResponse({ status: 404, description: 'Modül bulunamadı.' })
  async getModuleById(@Param('id') id: string) {
    return this.trainingService.findOneModule(id);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.SHIFT_LEAD, Role.ADMIN)
  @ApiOperation({ summary: 'Bir modülün quiz cevaplarını gönderir, puan hesaplar ve sertifika oluşturur' })
  @ApiResponse({ status: 200, description: 'Değerlendirme sonucu.' })
  @ApiResponse({ status: 400, description: 'Geçersiz gönderim.' })
  async submitQuiz(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitQuizDto) {
    return this.trainingService.submitQuiz(req.user.id, id, dto);
  }
}
