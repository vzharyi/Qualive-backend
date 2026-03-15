import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { GithubItemType, RuleType } from '@prisma/client';
import { GithubService } from './services/github.service';
import { EslintService, DefectInfo } from './services/eslint.service';
import { ScoringService } from './services/scoring.service';
import { AnalysisRepository } from './analysis.repository';
import { TasksService } from '../tasks/tasks.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { GithubAppService } from '../github/github.service';
import { Octokit } from '@octokit/rest';

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
        private githubAppService: GithubAppService,
    ) { }

    /**
     * Analyze a TaskGithubItem (PR or Commit).
     * Returns quality score (0–100) or null if nothing to analyze.
     */
    async analyzeGithubItem(
        item: { id: number; taskId: number; type: GithubItemType; githubId: string },
        projectId: number,
        userId: number,
    ): Promise<number | null> {
        this.logger.log(`Analyzing GitHub item #${item.id} (${item.type}: ${item.githubId})`);

        const { owner, repoName, token } = await this.resolveRepoContext(projectId, userId);

        let files;
        const analyzedRef = item.githubId;

        if (item.type === GithubItemType.PULL_REQUEST) {
            files = await this.getPrFiles(owner, repoName, Number(item.githubId), token);
        } else {
            files = await this.githubService.getCommitFiles(owner, repoName, item.githubId, token);
        }

        this.logger.log(`Found ${files.length} files to analyze`);

        if (files.length === 0) {
            this.logger.warn(`No supported JS/TS files found in ${item.type} ${item.githubId}`);
            return null;
        }

        const allDefects: DefectInfo[] = [];
        for (const file of files) {
            const defects = await this.eslintService.analyzeCode(file.filename, file.content);
            allDefects.push(...defects);
        }

        const totalLinesOfCode = files.reduce((sum, f) => sum + (f.additions || 0), 0);

        const qualityScore = this.scoringService.calculateQualityScore(allDefects, totalLinesOfCode);
        const decision = this.scoringService.getDecision(qualityScore);
        const roundedScore = Math.round(qualityScore);

        this.logger.log(`Quality Score: ${roundedScore}, Decision: ${decision}`);

        const report = await this.repository.createReport({
            taskId: item.taskId,
            githubItemId: item.id,
            analyzedRef,
            qualityScore: roundedScore,
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
                    penaltyPoints: this.scoringService.calculatePenaltyPoints(d.severity),
                })),
            );
        }

        return roundedScore;
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

    /** Fetch all committed files in a Pull Request (all commits combined) */
    private async getPrFiles(owner: string, repo: string, prNumber: number, token?: string) {
        const octokit = token ? new Octokit({ auth: token }) : new Octokit();

        try {
            // Get list of files changed in PR
            const { data: prFiles } = await octokit.rest.pulls.listFiles({
                owner,
                repo,
                pull_number: prNumber,
                per_page: 100,
            });

            // Get the HEAD SHA of the PR to fetch latest file content
            const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
            const headSha = pr.head.sha;

            const supportedExtensions = /\.(js|jsx|ts|tsx|vue|html|css|scss|less|mjs|cjs)$/;

            const files = prFiles.filter(
                (f) => f.status !== 'removed' && supportedExtensions.test(f.filename),
            );

            this.logger.log(`PR #${prNumber} has ${files.length} supported files`);

            const result = await Promise.all(
                files.map(async (f) => {
                    try {
                        const { data } = await octokit.rest.repos.getContent({
                            owner,
                            repo,
                            path: f.filename,
                            ref: headSha,
                        });

                        if ('content' in data && data.content) {
                            return {
                                filename: f.filename,
                                content: Buffer.from(data.content, 'base64').toString('utf-8'),
                                additions: f.additions,
                                deletions: f.deletions,
                                changes: f.changes,
                            };
                        }
                        return null;
                    } catch (err) {
                        this.logger.warn(`Failed to fetch ${f.filename}: ${err.message}`);
                        return null;
                    }
                }),
            );

            return result.filter((f) => f !== null) as Array<{
                filename: string;
                content: string;
                additions: number;
                deletions: number;
                changes: number;
            }>;
        } catch (error) {
            this.logger.error(`Failed to get PR files: ${error.message}`);
            throw new BadRequestException(`Cannot fetch PR #${prNumber}: ${error.message}`);
        }
    }

    /** Resolve repo owner/name and access token for a project */
    private async resolveRepoContext(projectId: number, userId: number) {
        const repositories = await this.repositoriesService.findAll(projectId, userId);

        if (repositories.length === 0) {
            throw new NotFoundException(
                'No repository linked to this project. Please link a GitHub repository first.',
            );
        }

        const repo = repositories[0];
        const accessTokenResult = await this.repositoriesService.getDecryptedToken(repo.id);

        let token: string | undefined;
        if (accessTokenResult.isInstallationToken && accessTokenResult.token) {
            token = await this.githubAppService.getInstallationToken(BigInt(accessTokenResult.token));
        } else {
            token = accessTokenResult.token ?? undefined;
        }

        const { owner, repo: repoName } = await this.githubService.getRepoDetailsById(
            repo.githubRepoId,
            token,
        );

        return { owner, repoName, token };
    }

    /** Map ESLint ruleId to RuleType enum */
    private mapRuleType(ruleId: string): RuleType {
        if (ruleId.includes('security') || ruleId.includes('eval')) {
            return RuleType.SECURITY;
        }
        if (ruleId.includes('performance') || ruleId.includes('complexity')) {
            return RuleType.PERFORMANCE;
        }
        if (ruleId.includes('const') || ruleId.includes('var') || ruleId.includes('prefer')) {
            return RuleType.BEST_PRACTICE;
        }
        return RuleType.STYLE;
    }
}
