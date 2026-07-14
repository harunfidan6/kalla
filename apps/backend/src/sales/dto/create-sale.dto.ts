import { IsEnum, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '@kafe/shared-types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({ description: 'Satılan ürünün ID değeri' })
  @IsString()
  @IsUUID('4', { message: 'Geçerli bir ürün ID gönderilmelidir' })
  productId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Ödeme yöntemi (CASH veya CARD)' })
  @IsEnum(PaymentMethod, { message: 'Ödeme yöntemi CASH veya CARD olmalıdır' })
  paymentMethod: PaymentMethod;
}
