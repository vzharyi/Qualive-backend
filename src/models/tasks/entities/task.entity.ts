import { Task as PrismaTask, TaskPriority } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Column } from '../../columns/entities/column.entity';
import { TaskGithubItem } from '../../task-github-items/entities/task-github-item.entity';

export class Task implements PrismaTask {
    @Expose()
    id: number;

    @Expose()
    projectId: number;

    @Expose()
    columnId: number;

    @Expose()
    title: string;

    @Expose()
    description: string | null;

    @Expose()
    assigneeId: number | null;

    @Expose()
    reporterId: number;

    @Expose()
    priority: TaskPriority;

    @Expose()
    order: number;

    @Expose()
    linesOfCode: number | null;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    // Relations
    @Expose()
    @Type(() => Column)
    column?: Column;

    @Expose()
    @Type(() => User)
    assignee?: User | null;

    @Expose()
    @Type(() => User)
    reporter?: User;

    @Expose()
    @Type(() => Project)
    project?: Project;

    @Expose()
    @Type(() => TaskGithubItem)
    githubItems?: TaskGithubItem[];
}
