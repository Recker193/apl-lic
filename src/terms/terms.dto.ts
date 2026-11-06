import { IsInt, IsString } from 'class-validator';

export class CreateTermDto {
  @IsString()
  schoolYear!: string;

  @IsInt()
  number!: number;

  @IsString()
  startsAt!: string;

  @IsString()
  endsAt!: string;
}
