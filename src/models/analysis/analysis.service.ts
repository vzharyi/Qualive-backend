import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { RuleType } from '@prisma/client';
import { GithubService } from './services/github.service';
import { EslintService, DefectInfo } from './services/eslint.service';
import { ScoringService } from './services/scoring.service';
import { AnalysisRepository } from './analysis.repository';
import { TasksService } from '../tasks/tasks.service';
import { RepositoriesService } from '../repositories/repositories.service';

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(
        private githubService: GithubService,
        private eslintService: EslintService,
        private scoringService: ScoringService,
        private repository: AnalysisRepository,
        private tasksService: TasksService,
        private repositoriesService: RepositoriesService,
    ) { }

    /** Run code quality analysis for a task */
    async analyzeTask(taskId: number, userId: number) {
        this.logger.log(`Starting analysis for task ${taskId}`);

        const task = await this.tasksService.findOne(taskId, userId);

        if (!task.githubCommitHash) {
            throw new BadRequestException(
                'Task has no GitHub commit linked. Please add githubCommitHash to the task.',
            );
        }

        if (!task.linesOfCode) {
            throw new BadRequestException(
                'Task has no linesOfCode specified. Please add linesOfCode to the task.',
            );
        }

        const repositories = await this.repositoriesService.findAll(
            task.projectId,
            userId,
        );

        if (repositories.length === 0) {
            throw new NotFoundException(
                'No repository linked to this project. Please link a GitHub repository first.',
            );
        }

        const repo = repositories[0];

        const accessToken = await this.repositoriesService.getDecryptedToken(
            repo.id,
        );

        const owner = 'owner';
        const repoName = 'repo';

        this.logger.log(
            `Fetching commit ${task.githubCommitHash} from ${owner}/${repoName}`,
        );

        const files = await this.githubService.getCommitFiles(
            owner,
            repoName,
            task.githubCommitHash,
            accessToken || undefined,
        );

        this.logger.log(`Found ${files.length} files to analyze`);

        if (files.length === 0) {
            throw new BadRequestException(
                'No JavaScript/TypeScript files found in this commit',
            );
        }

        const allDefects: DefectInfo[] = [];

        for (const file of files) {
            this.logger.log(`Analyzing ${file.filename}...`);
            const defects = await this.eslintService.analyzeCode(
                file.filename,
                file.content,
            );
            allDefects.push(...defects);
        }

        this.logger.log(`Total defects found: ${allDefects.length}`);

        const qualityScore = this.scoringService.calculateQualityScore(
            allDefects,
            task.linesOfCode,
        );

        const decision = this.scoringService.getDecision(qualityScore);

        this.logger.log(
            `Quality Score: ${qualityScore}, Decision: ${decision}`,
        );

        const report = await this.repository.createReport({
            taskId,
            analyzedCommitHash: task.githubCommitHash,
            qualityScore: Math.round(qualityScore),
            decision,
        });

        if (allDefects.length > 0) {
            await this.repository.createDefects(
                report.id,
                allDefects.map((d) => ({
                    ruleType: this.mapRuleType(d.ruleId),
                    message: d.message,
                    filePath: d.filename,
                    lineNumber: d.line,
                    severity: d.severity,
                    penaltyPoints: this.scoringService.calculatePenaltyPoints(
                        d.severity,
                    ),
                })),
            );
        }

        this.logger.log(`Analysis complete. Report ID: ${report.id}`);

        return this.repository.findById(report.id);
    }

    /** Get analysis reports for a task */
    async getReportsByTask(taskId: number, userId: number) {
        await this.tasksService.findOne(taskId, userId);
        return this.repository.findByTaskId(taskId);
    }

    /** Get defects for an analysis report */
    async getDefectsByReport(reportId: number, userId: number) {
        const report = await this.repository.findById(reportId);

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        await this.tasksService.findOne(report.taskId, userId);

        return this.repository.findDefectsByReportId(reportId);
    }

    /** Map ESLint ruleId to RuleType enum */
    private mapRuleType(ruleId: string): RuleType {
        if (ruleId.includes('security') || ruleId.includes('eval')) {
            return RuleType.SECURITY;
        }
        if (ruleId.includes('performance') || ruleId.includes('complexity')) {
            return RuleType.PERFORMANCE;
        }
        if (
            ruleId.includes('const') ||
            ruleId.includes('var') ||
            ruleId.includes('prefer')
        ) {
            return RuleType.BEST_PRACTICE;
        }
        return RuleType.STYLE;
    }
}
