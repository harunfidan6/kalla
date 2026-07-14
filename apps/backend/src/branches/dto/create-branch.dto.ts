import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'Kadıköy Şube' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Caferağa Mah. Moda Cad. No:12' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Kadıköy' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 40.9903 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 29.0275 })
  @IsLongitude()
  longitude: number;
}
