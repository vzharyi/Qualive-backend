import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({ example: 1, description: 'ID of the task to comment on' })
    @IsInt()
    taskId: number;

    @ApiProperty({ example: 'This is a comment', description: 'Content of the comment' })
    @IsString()
    @IsNotEmpty()
    content: string;
}
