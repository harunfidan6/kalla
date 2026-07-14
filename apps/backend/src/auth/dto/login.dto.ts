import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'musteri@ornek.com', description: 'Kayıtlı e-posta adresi' })
  @IsEmail({}, { message: 'Geçersiz e-posta adresi' })
  email: string;

  @ApiProperty({ example: 'sifre123', description: 'Hesap şifresi' })
  @IsNotEmpty({ message: 'Şifre boş bırakılamaz' })
  @IsString()
  password: string;
}
