import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
