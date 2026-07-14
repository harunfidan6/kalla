import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChangeRequestDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Değişim talebinde bulunulan vardiya\'nın UUID\'si',
  })
  @IsNotEmpty({ message: 'Vardiya ID boş bırakılamaz' })
  @IsString()
  shiftId: string;

  @ApiProperty({
    example: 'Doktor randevum var, bu vardiyada çalışamayacağım.',
    description: 'Vardiya değişim gerekçesi (en az 5 karakter)',
  })
  @IsNotEmpty({ message: 'Değişim gerekçesi belirtilmelidir' })
  @IsString()
  @MinLength(5, { message: 'Gerekçe en az 5 karakter olmalıdır' })
  reason: string;
}
