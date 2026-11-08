import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateTimetableEntryDto {
  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId!: string;

  @IsUUID()
  @IsNotEmpty()
  teacherId!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsInt()
  @Min(1)
  @Max(10)
  period!: number;

  @IsString()
  @IsNotEmpty()
  startTime!: string; // ex: "08:00"

  @IsString()
  @IsNotEmpty()
  endTime!: string; // ex: "08:50"

  @IsOptional()
  @IsString()
  room?: string;
}

