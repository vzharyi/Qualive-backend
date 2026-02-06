import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Repository } from './entities/repository.entity';

@Injectable()
export class RepositoriesRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Partial<Repository>): Promise<Repository> {
        return this.prisma.repository.create({
            data: data as any,
        });
    }

    async findById(id: number, includeProject = false): Promise<Repository | null> {
        return this.prisma.repository.findUnique({
            where: { id },
            include: includeProject ? { project: true } : undefined,
        });
    }

    async findByProjectId(projectId: number): Promise<Repository[]> {
        return this.prisma.repository.findMany({
            where: { projectId },
            orderBy: { connectedAt: 'desc' },
        });
    }

    async findByGithubRepoId(githubRepoId: number): Promise<Repository | null> {
        return this.prisma.repository.findFirst({
            where: { githubRepoId },
        });
    }

    async update(id: number, data: Partial<Repository>): Promise<Repository> {
        return this.prisma.repository.update({
            where: { id },
            data: data as any,
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.repository.delete({
            where: { id },
        });
    }
}
