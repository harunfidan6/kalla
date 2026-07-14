import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuizAnswerItemDto {
  @ApiProperty({
    example: 'q1a2b3c4-d5e6-f789-0abc-def123456789',
    description: 'Cevaplanan quiz sorusunun UUID\'si',
  })
  @IsNotEmpty({ message: 'Soru ID boş bırakılamaz' })
  @IsString()
  questionId: string;

  @ApiProperty({
    example: 'Espresso çekirdeği kısmi oksidasyon sonrası tatlandırılmış bir içecektir',
    description: 'Kullanıcının seçtiği cevap metni',
  })
  @IsNotEmpty({ message: 'Seçilen seçenek belirtilmelidir' })
  @IsString()
  selectedOption: string;
}

export class SubmitQuizDto {
  @ApiProperty({
    type: [QuizAnswerItemDto],
    description: 'Quiz cevapları listesi — her soru için bir cevap objesi',
    example: [
      {
        questionId: 'q1a2b3c4-d5e6-f789-0abc-def123456789',
        selectedOption: 'Espresso çekirdeği kısmi oksidasyon sonrası tatlandırılmış bir içecektir',
      },
    ],
  })
  @IsArray({ message: 'Cevaplar bir liste olmalıdır' })
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers: QuizAnswerItemDto[];
}
