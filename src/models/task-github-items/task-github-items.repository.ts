import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubItemType } from '@prisma/client';

@Injectable()
export class TaskGithubItemsRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        taskId: number;
        type: GithubItemType;
        githubId: string;
        url: string;
        title?: string;
        author?: string;
    }) {
        return this.prisma.taskGithubItem.create({ data });
    }

    async findByTaskId(taskId: number) {
        return this.prisma.taskGithubItem.findMany({
            where: { taskId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: number) {
        return this.prisma.taskGithubItem.findUnique({ where: { id } });
    }

    async updateScore(id: number, codeScore: number) {
        return this.prisma.taskGithubItem.update({
            where: { id },
            data: { codeScore },
        });
    }

    async delete(id: number) {
        return this.prisma.taskGithubItem.delete({ where: { id } });
    }

    /** Find existing item by taskId + githubId to avoid duplicates */
    async findByTaskAndGithubId(taskId: number, githubId: string) {
        return this.prisma.taskGithubItem.findFirst({
            where: { taskId, githubId },
        });
    }
}
