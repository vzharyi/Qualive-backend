import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepositoryDto {
    @ApiProperty({
        description: 'Project ID to link repository to',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    projectId: number;

    @ApiProperty({
        description: 'GitHub repository ID',
        example: 123456789,
    })
    @IsNumber()
    @IsNotEmpty()
    githubRepoId: number;

    @ApiProperty({
        description: 'GitHub access token for private repositories (will be encrypted)',
        example: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        required: false,
    })
    @IsString()
    @IsOptional()
    accessToken?: string;
}
