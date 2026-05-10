import { IsEnum, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GithubItemType } from '@prisma/client';

export class CreateTaskGithubItemDto {
    @ApiProperty({
        enum: GithubItemType,
        description: 'Type of GitHub item: PULL_REQUEST or COMMIT',
    })
    @IsEnum(GithubItemType)
    type: GithubItemType;

    @ApiProperty({
        description: 'PR number (e.g. "42") or commit SHA (e.g. "a1b2c3d4")',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    githubId: string;

    @ApiProperty({
        description: 'Direct link to GitHub PR or commit page',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    url: string;

    @ApiProperty({ required: false, description: 'PR title or commit message' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    title?: string;

    @ApiProperty({ required: false, description: 'Author GitHub username' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    author?: string;
}
