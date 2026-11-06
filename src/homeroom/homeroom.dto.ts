import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateHomeroomAssignmentDto {
  @IsString()
  classId!: string;

  @IsString()
  teacherId!: string;

  @IsString()
  schoolYear!: string;
}

export class SetConductGradeDto {
  @IsInt()
  @Min(1)
  @Max(10)
  value!: number;
}
