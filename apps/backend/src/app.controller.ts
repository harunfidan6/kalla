import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('System Health')
@Controller('health')
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Sunucu ve sistem sağlık durumunu sorgular' })
  @ApiResponse({ status: 200, description: 'Sistem çalışır durumda.' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
