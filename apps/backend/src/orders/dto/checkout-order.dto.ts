import { IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutOrderDto {
  @ApiProperty({ example: false, description: 'Cüzdan bakiyesi kullanılsın mı?' })
  @IsBoolean()
  useWallet: boolean;

  @ApiPropertyOptional({
    example: 25.0,
    description: 'Cüzdandan kullanılacak tutar (TL). useWallet true ise geçerlidir.',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  walletAmount?: number;

  @ApiPropertyOptional({
    example: 'iyzico-card-token-9f8e7d6c',
    description: 'iyzico Checkout Form / iyzico.js tarafından üretilen tek kullanımlık kart token\'ı. ' +
      'Ham kart numarası, CVC veya son kullanma tarihi ASLA bu API\'ye gönderilmez.',
  })
  @IsOptional()
  @IsString()
  paymentToken?: string;
}
