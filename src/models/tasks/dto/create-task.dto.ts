import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsEnum,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
    @ApiProperty({ description: 'Project ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    projectId: number;

    @ApiProperty({ description: 'Column ID (links task to a board column)', example: 3 })
    @IsNumber()
    @IsNotEmpty()
    columnId: number;

    @ApiProperty({ description: 'Task title', example: 'Implement login feature', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string;

    @ApiProperty({ description: 'Task description', example: 'Add JWT auth with refresh tokens', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'User ID to assign task to', example: 2, required: false })
    @IsNumber()
    @IsOptional()
    assigneeId?: number;

    @ApiProperty({ description: 'Task priority', enum: TaskPriority, example: TaskPriority.MEDIUM, required: false })
    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @ApiProperty({ description: 'Task order (used for manual sorting)', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    order?: number;
}
