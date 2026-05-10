import {
    Defect as PrismaDefect,
    DefectSeverity,
    RuleType,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { AnalysisReport } from './analysis-report.entity';

export class Defect implements PrismaDefect {
    @Expose()
    id: number;

    @Expose()
    reportId: number;

    @Expose()
    ruleType: RuleType;

    @Expose()
    message: string;

    @Expose()
    filePath: string | null;

    @Expose()
    lineNumber: number | null;

    @Expose()
    severity: DefectSeverity;

    @Expose()
    penaltyPoints: number;

    // Relations
    @Expose()
    @Type(() => AnalysisReport)
    report?: AnalysisReport;
}
