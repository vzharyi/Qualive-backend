import { TaskGithubItem as PrismaTaskGithubItem, GithubItemType } from '@prisma/client';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TaskGithubItem implements PrismaTaskGithubItem {
    @Expose()
    @ApiProperty()
    id: number;

    @Expose()
    @ApiProperty()
    taskId: number;

    @Expose()
    @ApiProperty({ enum: GithubItemType })
    type: GithubItemType;

    @Expose()
    @ApiProperty({ description: 'PR number (e.g. "42") or commit SHA (e.g. "a1b2c3d")' })
    githubId: string;

    @Expose()
    @ApiProperty({ description: 'Direct link to GitHub PR or commit' })
    url: string;

    @Expose()
    @ApiProperty({ nullable: true })
    title: string | null;

    @Expose()
    @ApiProperty({ nullable: true })
    author: string | null;

    @Expose()
    @ApiProperty({ nullable: true, description: 'ESLint quality score (0-100)' })
    codeScore: number | null;

    @Expose()
    @ApiProperty()
    createdAt: Date;
}
