import { Task as PrismaTask, TaskStatus, TaskPriority } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';

export class Task implements PrismaTask {
    @Expose()
    id: number;

    @Expose()
    projectId: number;

    @Expose()
    title: string;

    @Expose()
    description: string | null;

    @Expose()
    assigneeId: number | null;

    @Expose()
    reporterId: number;

    @Expose()
    status: TaskStatus;

    @Expose()
    priority: TaskPriority;

    @Expose()
    githubCommitHash: string | null;

    @Expose()
    linesOfCode: number | null;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    // Relations
    @Expose()
    @Type(() => User)
    assignee?: User | null;

    @Expose()
    @Type(() => User)
    reporter?: User;

    @Expose()
    @Type(() => Project)
    project?: Project;
}
