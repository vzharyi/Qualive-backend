import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsRepository {
    constructor(private prisma: PrismaService) { }

    async create(userId: number, dto: CreateCommentDto) {
        return this.prisma.comment.create({
            data: {
                content: dto.content,
                taskId: dto.taskId,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        login: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    async findAllByTaskId(taskId: number) {
        return this.prisma.comment.findMany({
            where: { taskId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        login: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    async findById(id: number) {
        return this.prisma.comment.findUnique({
            where: { id },
            include: {
                task: {
                    select: {
                        projectId: true,
                    }
                }
            }
        });
    }

    async delete(id: number) {
        return this.prisma.comment.delete({
            where: { id },
        });
    }
}
