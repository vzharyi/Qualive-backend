import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from './entities/project.entity';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Partial<Project>): Promise<Project> {
        return this.prisma.project.create({
            data: data as any,
        });
    }

    async findById(id: number, includeRelations = false): Promise<Project | null> {
        return this.prisma.project.findUnique({
            where: { id },
            include: includeRelations
                ? {
                    owner: true,
                    members: {
                        include: {
                            user: true,
                        },
                    },
                }
                : undefined,
        });
    }

    async findUserProjects(userId: number): Promise<Project[]> {
        return this.prisma.project.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                owner: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async update(id: number, data: Partial<Project>): Promise<Project> {
        return this.prisma.project.update({
            where: { id },
            data: data as any,
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.project.delete({
            where: { id },
        });
    }

    async addMember(projectId: number, userId: number, role: ProjectRole) {
        return this.prisma.projectMember.create({
            data: {
                projectId,
                userId,
                role,
            },
            include: {
                user: true,
            },
        });
    }

    async findMember(projectId: number, userId: number) {
        return this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
    }

    async removeMember(projectId: number, userId: number) {
        await this.prisma.projectMember.delete({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
    }

    async updateMemberRole(projectId: number, userId: number, role: ProjectRole) {
        return this.prisma.projectMember.update({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
            data: {
                role,
            },
        });
    }
}
