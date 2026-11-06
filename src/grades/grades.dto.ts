import { GradeType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  studentId!: string;

  @IsEnum(GradeType)
  type!: GradeType;

  @IsInt()
  @Min(1)
  @Max(10)
  value!: number;

  @IsString()
  gradedAt!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateGradeDto {
  @IsInt()
  @Min(1)
  @Max(10)
  value!: number;

  @IsString()
  reason!: string;
}

export class VoidGradeDto {
  @IsString()
  reason!: string;
}
