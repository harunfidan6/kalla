import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Şifre sıfırlama e-postasından gelen token' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'YeniSifre123!', description: 'En az 8 karakter; en az bir büyük harf, bir küçük harf ve bir rakam veya özel karakter içermelidir' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam veya özel karakter içermelidir',
  })
  newPassword: string;
}
