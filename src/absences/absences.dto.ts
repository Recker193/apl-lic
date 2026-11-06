import { IsOptional, IsString } from 'class-validator';

export class CreateAbsenceDto {
  @IsString()
  studentId!: string;

  @IsString()
  date!: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

export class ExcuseAbsenceDto {
  @IsString()
  reason!: string;
}
