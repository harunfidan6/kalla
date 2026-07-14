import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftChangeRequestStatus } from '@kafe/shared-types';

export class ProcessChangeRequestDto {
  @ApiProperty({
    example: ShiftChangeRequestStatus.APPROVED,
    description: 'Vardiya değişim talebi için yönetici kararı',
    enum: ShiftChangeRequestStatus,
  })
  @IsNotEmpty({ message: 'Karar belirtilmelidir' })
  @IsEnum(ShiftChangeRequestStatus, { message: 'Geçersiz karar. approved veya rejected olmalıdır' })
  status: ShiftChangeRequestStatus;
}
