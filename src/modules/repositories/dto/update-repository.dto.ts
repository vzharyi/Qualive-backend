import { PartialType } from '@nestjs/swagger';
import { CreateRepositoryDto } from './create-repository.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRepositoryDto extends PartialType(CreateRepositoryDto) {
    @ApiProperty({
        description: 'GitHub repository ID',
        example: 987654321,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    githubRepoId?: number;

    @ApiProperty({
        description: 'GitHub access token (will be re-encrypted)',
        example: 'ghp_new_token',
        required: false,
    })
    @IsString()
    @IsOptional()
    accessToken?: string;
}
