import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({ description: 'Vardiyanın atanacağı personelin kullanıcı ID değeri' })
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @ApiProperty({ example: '2026-07-20T08:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-07-20T16:00:00.000Z' })
  @IsDateString()
  endTime: string;
}
