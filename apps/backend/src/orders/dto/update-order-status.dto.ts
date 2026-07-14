import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@kafe/shared-types';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Hedef sipariş durumu' })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Kasada ödeme alan siparişler "Teslim Et" durumuna geçerken zorunludur (Nakit/Kart)',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
