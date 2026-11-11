import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class SendFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  senderName?: string;

  @IsEmail()
  @IsOptional()
  senderEmail?: string;
}

