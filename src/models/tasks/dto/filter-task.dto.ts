import { IsNumber, IsOptional, IsEnum, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterTaskDto {
    @ApiProperty({ description: 'Project ID (required)', example: 1 })
    @IsNumber()
    @Type(() => Number)
    projectId: number;

    @ApiProperty({ description: 'Filter by column ID', example: 2, required: false })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    columnId?: number;

    @ApiProperty({ description: 'Filter by assignee ID', example: 2, required: false })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    assigneeId?: number;

    @ApiProperty({ description: 'Filter by reporter ID', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    reporterId?: number;

    @ApiProperty({ description: 'Filter by priority', enum: TaskPriority, example: TaskPriority.HIGH, required: false })
    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @ApiProperty({
        description: 'Sort by field',
        example: 'createdAt',
        enum: ['createdAt', 'priority', 'updatedAt'],
        required: false,
    })
    @IsString()
    @IsOptional()
    @IsIn(['createdAt', 'priority', 'updatedAt'])
    sortBy?: string;

    @ApiProperty({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'], required: false })
    @IsString()
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
