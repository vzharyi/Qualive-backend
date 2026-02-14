import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @ApiProperty({
        description: 'Task status (for Kanban drag-and-drop)',
        enum: TaskStatus,
        example: TaskStatus.IN_PROGRESS,
        required: false,
    })
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @ApiProperty({
        description: 'GitHub commit hash',
        example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
        required: false,
    })
    @IsString()
    @IsOptional()
    githubCommitHash?: string;


}
