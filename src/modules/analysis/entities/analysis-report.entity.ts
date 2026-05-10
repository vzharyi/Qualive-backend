import {
    AnalysisReport as PrismaAnalysisReport,
    ReportDecision,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { Task } from '../../tasks/entities/task.entity';
import { Defect } from './defect.entity';
import { TaskGithubItem } from '../../task-github-items/entities/task-github-item.entity';

export class AnalysisReport implements PrismaAnalysisReport {
    @Expose()
    id: number;

    @Expose()
    taskId: number;

    @Expose()
    githubItemId: number | null;

    @Expose()
    analyzedRef: string;

    @Expose()
    qualityScore: number | null;

    @Expose()
    decision: ReportDecision;

    @Expose()
    analyzedAt: Date;

    // Relations
    @Expose()
    @Type(() => Task)
    task?: Task;

    @Expose()
    @Type(() => Defect)
    defects?: Defect[];

    @Expose()
    @Type(() => TaskGithubItem)
    githubItem?: TaskGithubItem;
}
