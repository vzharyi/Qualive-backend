import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
    @ApiProperty({
        description: 'Project name',
        example: 'My Awesome Project',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Project description',
        example: 'This is a project for managing tasks',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Project avatar URL',
        example: 'https://example.com/avatar.png',
        required: false,
    })
    @IsString()
    @IsOptional()
    avatarUrl?: string;
}
