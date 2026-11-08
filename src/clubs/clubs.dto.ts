import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  formsUrl?: string; // Link Google Forms

  @IsOptional()
  @IsUUID()
  coordinatorId?: string; // Optional: dacă nu e specificat, devine user-ul curent
}

export class UpdateClubDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  formsUrl?: string;

  @IsOptional()
  @IsUUID()
  coordinatorId?: string;
}

export class CreateWeekendMeetingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek; // SATURDAY sau SUNDAY

  @IsString()
  @IsNotEmpty()
  startTime!: string; // ex: "10:00"

  @IsString()
  @IsNotEmpty()
  endTime!: string; // ex: "13:30"

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

