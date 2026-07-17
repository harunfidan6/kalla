import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'musteri@ornek.com', description: 'Kullanıcının e-posta adresi' })
  @IsEmail({}, { message: 'Geçersiz e-posta adresi' })
  email: string;

  @ApiProperty({ example: '+905551234567', description: 'Kullanıcının telefon numarası' })
  @IsNotEmpty({ message: 'Telefon numarası boş bırakılamaz' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Sifre123!', description: 'En az 8 karakter; en az bir büyük harf, bir küçük harf ve bir rakam veya özel karakter içermelidir' })
  @IsNotEmpty({ message: 'Şifre boş bırakılamaz' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam veya özel karakter içermelidir',
  })
  password: string;

  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Kullanıcının ad ve soyadı' })
  @IsNotEmpty({ message: 'Ad soyad boş bırakılamaz' })
  @IsString()
  fullName: string;

  // Staff specific fields
  @ApiPropertyOptional({ example: 'Baş Barista', description: 'Personelin iş pozisyonu' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'EMP-001', description: 'Personelin dahili çalışan kodu' })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  // Customer specific fields
  @ApiPropertyOptional({ example: '1995-05-15', description: 'Müşterinin doğum tarihi (YYYY-MM-DD)' })
  @IsOptional()
  birthday?: string;

  // Yasal onaylar (KVKK/ETK) — sadece müşteri self-servis kaydında zorunlu tutulur,
  // bkz. AuthService.register(). Personel kaydında (CreateStaffDto) doğrulanmaz.
  @ApiPropertyOptional({ example: true, description: 'Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni onayı' })
  @IsOptional()
  @IsBoolean()
  kvkkAccepted?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Ticari elektronik ileti (ETK) gönderimi onayı — isteğe bağlıdır' })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
