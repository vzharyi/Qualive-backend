import { Repository as PrismaRepository } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { Project } from '../../projects/entities/project.entity';

export class Repository implements PrismaRepository {
    @Expose()
    id: number;

    @Expose()
    projectId: number;

    @Expose()
    githubRepoId: number;

    accessToken: string | null;

    @Expose()
    connectedAt: Date;

    // Relations
    @Expose()
    @Type(() => Project)
    project?: Project;
}
