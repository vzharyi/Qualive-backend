import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123', description: 'Current password' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123', description: 'New password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}
