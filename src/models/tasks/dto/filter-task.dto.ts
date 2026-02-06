import { IsNumber, IsOptional, IsEnum, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterTaskDto {
    @ApiProperty({
        description: 'Project ID (required)',
        example: 1,
    })
    @IsNumber()
    @Type(() => Number)
    projectId: number;

    @ApiProperty({
        description: 'Filter by assignee ID',
        example: 2,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    assigneeId?: number;

    @ApiProperty({
        description: 'Filter by reporter ID',
        example: 1,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    reporterId?: number;

    @ApiProperty({
        description: 'Filter by task status',
        enum: TaskStatus,
        example: TaskStatus.IN_PROGRESS,
        required: false,
    })
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @ApiProperty({
        description: 'Filter by task priority',
        enum: TaskPriority,
        example: TaskPriority.HIGH,
        required: false,
    })
    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @ApiProperty({
        description: 'Sort by field',
        example: 'createdAt',
        enum: ['createdAt', 'priority', 'status', 'updatedAt'],
        required: false,
    })
    @IsString()
    @IsOptional()
    @IsIn(['createdAt', 'priority', 'status', 'updatedAt'])
    sortBy?: string;

    @ApiProperty({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
        required: false,
    })
    @IsString()
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
