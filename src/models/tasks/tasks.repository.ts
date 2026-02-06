import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Task } from './entities/task.entity';
import { FilterTaskDto } from './dto/filter-task.dto';
import { TaskStatus, TaskPriority } from '@prisma/client';

@Injectable()
export class TasksRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Partial<Task>): Promise<Task> {
        return this.prisma.task.create({
            data: data as any,
            include: {
                assignee: true,
                reporter: true,
                project: true,
            },
        });
    }

    async findById(id: number): Promise<Task | null> {
        return this.prisma.task.findUnique({
            where: { id },
            include: {
                assignee: true,
                reporter: true,
                project: true,
            },
        });
    }

    async findAll(filters: FilterTaskDto): Promise<Task[]> {
        const {
            projectId,
            assigneeId,
            reporterId,
            status,
            priority,
            sortBy,
            sortOrder,
        } = filters;

        const where: any = { projectId };

        if (assigneeId !== undefined) {
            where.assigneeId = assigneeId;
        }

        if (reporterId !== undefined) {
            where.reporterId = reporterId;
        }

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        } else {
            orderBy.createdAt = 'desc';
        }

        return this.prisma.task.findMany({
            where,
            include: {
                assignee: true,
                reporter: true,
            },
            orderBy,
        });
    }

    async update(id: number, data: Partial<Task>): Promise<Task> {
        return this.prisma.task.update({
            where: { id },
            data: data as any,
            include: {
                assignee: true,
                reporter: true,
            },
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.task.delete({
            where: { id },
        });
    }
}
