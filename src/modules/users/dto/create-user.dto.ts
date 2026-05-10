import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimAndLowercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(trim)
  login: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail()
  @MaxLength(255)
  @Transform(trimAndLowercase)
  email: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trim)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
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
