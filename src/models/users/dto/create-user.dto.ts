import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimAndLowercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(trim)
  login: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsEmail()
  @MaxLength(255)
  @Transform(trimAndLowercase)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trim)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trim)
  lastName: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  @Transform(trim)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  githubId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  googleId?: string;
}
