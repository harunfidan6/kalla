import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopupWalletDto {
  @ApiProperty({
    example: 100,
    description: 'Yüklenecek tutar (TL cinsinden, en az 10 TL)',
    type: Number,
  })
  @IsNumber()
  @Min(10, { message: 'En az 10 TL yükleyebilirsiniz' })
  amount: number;

  @ApiProperty({
    example: 'iyzico-card-token-9f8e7d6c',
    description: 'iyzico Checkout Form / iyzico.js tarafından üretilen tek kullanımlık kart token\'ı.',
  })
  @IsNotEmpty({ message: 'Ödeme token\'ı boş bırakılamaz' })
  @IsString()
  paymentToken: string;
}
