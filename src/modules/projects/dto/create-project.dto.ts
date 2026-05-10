import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateProjectColumnDto {
    @ApiProperty({ example: 'To Do' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '#94a3b8', required: false })
    @IsString()
    @IsOptional()
    color?: string;
}

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

    @ApiProperty({
        description: 'Custom board columns',
        type: [CreateProjectColumnDto],
        required: false,
    })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateProjectColumnDto)
    columns?: CreateProjectColumnDto[];
}
