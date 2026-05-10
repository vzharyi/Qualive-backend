import { Repository as PrismaRepository } from '@prisma/client';
import { Expose, Type, Transform } from 'class-transformer';
import { Project } from '../../projects/entities/project.entity';

export class Repository implements PrismaRepository {
    @Expose()
    id: number;

    @Expose()
    projectId: number;

    @Expose()
    @Transform(({ value }) => (value ? value.toString() : value))
    githubRepoId: bigint;

    @Expose()
    @Transform(({ value }) => (value ? value.toString() : value))
    installationId: bigint | null;

    accessToken: string | null;

    @Expose()
    connectedAt: Date;

    // Relations
    @Expose()
    @Type(() => Project)
    project?: Project;
}
