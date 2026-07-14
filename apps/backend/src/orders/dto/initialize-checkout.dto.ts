import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class InitializeCheckoutDto {
  @ApiProperty({ example: false, description: 'Cüzdan bakiyesi kullanılacak mı?' })
  @IsBoolean()
  useWallet: boolean;

  @ApiPropertyOptional({ example: 50, description: 'Cüzdandan kullanılacak tutar (TL cinsinden)' })
  @IsOptional()
  @IsNumber({}, { message: 'Cüzdan tutarı sayısal olmalıdır' })
  @Min(0)
  walletAmount?: number;
}
