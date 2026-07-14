import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustWalletDto {
  @ApiProperty({ example: 5000, description: 'Eklenecek/çıkarılacak miktar (kuruş cinsinden, negatif değer düşürür)' })
  @IsNumber({}, { message: 'Tutar sayısal bir değer olmalıdır' })
  amount: number;

  @ApiPropertyOptional({ example: 'Kampanya promosyonu', description: 'Düzenleme nedeni (opsiyonel)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
