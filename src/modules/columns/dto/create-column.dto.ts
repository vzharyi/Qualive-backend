import { IsString, IsNotEmpty, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColumnDto {
    @ApiProperty({ description: 'Column name', example: 'In Review', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'Column color (hex or CSS name)', example: '#FF5733', required: false })
    @IsString()
    @IsOptional()
    color?: string;

    @ApiProperty({ description: 'Display order of the column (0-based)', example: 0, required: false })
    @IsNumber()
    @Min(0)
    @IsOptional()
    order?: number;
}
