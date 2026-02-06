import { IsEmail, IsNumber, IsOptional, IsEnum, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

export class AddMemberDto {
    @ApiProperty({
        description: 'User email to add to project',
        example: 'user@example.com',
        required: false,
    })
    @IsEmail()
    @IsOptional()
    @ValidateIf((o) => !o.userId)
    email?: string;

    @ApiProperty({
        description: 'User ID to add to project',
        example: 1,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @ValidateIf((o) => !o.email)
    userId?: number;

    @ApiProperty({
        description: 'Role for the new member',
        enum: ProjectRole,
        example: ProjectRole.DEVELOPER,
    })
    @IsEnum(ProjectRole)
    role: ProjectRole;
}
