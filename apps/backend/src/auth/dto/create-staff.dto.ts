import { RegisterDto } from './register.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@kafe/shared-types';

export class CreateStaffDto extends RegisterDto {
  @ApiProperty({
    example: Role.STAFF,
    description: 'Personele atanacak rol',
    enum: Role,
  })
  @IsNotEmpty({ message: 'Rol boş bırakılamaz' })
  @IsEnum(Role, { message: 'Geçersiz rol seçimi' })
  role: Role;
}
