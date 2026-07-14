import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Ev', description: 'Adres etiketi (Ev, İş, vb.)' })
  @IsString()
  @IsNotEmpty({ message: 'Etiket boş olamaz' })
  label: string;

  @ApiProperty({ example: 'Bağdat Caddesi No: 123 Daire: 4', description: 'Açık adres' })
  @IsString()
  @IsNotEmpty({ message: 'Adres boş olamaz' })
  addressLine: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Kadıköy' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: false, description: 'Varsayılan adres olarak işaretle' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
