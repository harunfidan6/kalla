import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType, PaymentStatus } from '@kafe/shared-types';

export class OrderItemDto {
  @ApiProperty({ example: 'c97e67dc-0c84-468f-bce1-5d2d9f713159', description: 'Sipariş edilecek ürünün UUID\'si' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 2, description: 'Ürün adedi (1-50 arası)', type: Number })
  @IsInt()
  @Min(1)
  @Max(50, { message: 'Bir sipariş kaleminde en fazla 50 adet olabilir' })
  quantity: number;

  @ApiPropertyOptional({
    example: '{"milk":"Yulaf","sweetness":"Az Şekerli","syrup":"Karamel"}',
    description: 'Ürün özelleştirme seçenekleri (JSON string)',
  })
  @IsOptional()
  @IsString()
  options?: string; // JSON configuration string
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'ec8641dc-6f07-4d0b-886b-6ce08c69f91d',
    description: 'Siparişi karşılayacak şubenin ID değeri',
  })
  @IsNotEmpty()
  @IsString()
  branchId: string;

  @ApiProperty({
    example: OrderType.PICKUP,
    description: 'Sipariş türü: teslim alma veya masa servisi',
    enum: OrderType,
  })
  @IsNotEmpty()
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({
    example: PaymentStatus.PAID_ONLINE,
    description: 'Ödeme yöntemi: online kart ödemesi veya kasada ödeme',
    enum: PaymentStatus,
  })
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({
    example: 'Lütfen az sıcak yapın',
    description: 'Sipariş için barista notu',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Sipariş kalemi listesi',
    example: [{ productId: 'c97e67dc-0c84-468f-bce1-5d2d9f713159', quantity: 2, options: '{"milk":"Yulaf"}' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
