import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportDecision } from '@prisma/client';

@Injectable()
export class AnalysisRepository {
    constructor(private prisma: PrismaService) { }

    /** Create analysis report linked to optional TaskGithubItem */
    async createReport(data: {
        taskId: number;
        githubItemId?: number | null;
        analyzedRef: string;
        qualityScore: number;
        decision: ReportDecision;
    }) {
        return this.prisma.analysisReport.create({
            data,
            include: { task: true },
        });
    }

    /** Create defects (batch insert) */
    async createDefects(
        reportId: number,
        defects: Array<{
            ruleType: any;
            message: string;
            filePath: string;
            lineNumber: number;
            severity: any;
            penaltyPoints: number;
        }>,
    ): Promise<void> {
        if (defects.length === 0) return;

        await this.prisma.defect.createMany({
            data: defects.map((d) => ({ reportId, ...d })),
        });
    }

    /** Get all reports for a task */
    async findByTaskId(taskId: number) {
        return this.prisma.analysisReport.findMany({
            where: { taskId },
            include: { defects: true, githubItem: true },
            orderBy: { analyzedAt: 'desc' },
        });
    }

    /** Get report by ID */
    async findById(id: number) {
        return this.prisma.analysisReport.findUnique({
            where: { id },
            include: { task: true, defects: true, githubItem: true },
        });
    }

    /** Get defects for a report */
    async findDefectsByReportId(reportId: number) {
        return this.prisma.defect.findMany({
            where: { reportId },
            orderBy: [{ severity: 'desc' }, { lineNumber: 'asc' }],
        });
    }
}
