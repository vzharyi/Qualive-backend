import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnalysisDto {
    @ApiProperty({
        description: 'Task ID to analyze',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    taskId: number;
}
