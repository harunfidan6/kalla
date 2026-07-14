import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBranchDto {
  @ApiProperty({ description: 'Personelin atanacağı şubenin ID değeri' })
  @IsNotEmpty()
  @IsString()
  branchId: string;
}
