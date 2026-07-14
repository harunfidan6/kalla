import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class InitializeTopupDto {
  @ApiProperty({ example: 100, description: 'Yüklenecek tutar (TL cinsinden, minimum 10 TL)' })
  @IsNumber({}, { message: 'Tutar sayısal bir değer olmalıdır' })
  @Min(1, { message: 'Tutar 0\'dan büyük olmalıdır' })
  amount: number;
}
