import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { GithubItemType } from '@prisma/client';
import { TaskGithubItemsRepository } from './task-github-items.repository';
import { CreateTaskGithubItemDto } from './dto/create-task-github-item.dto';
import { TasksService } from '../tasks/tasks.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { GithubAppService } from '../github/github.service';
import { GithubService } from '../analysis/services/github.service';
import { AnalysisService } from '../analysis/analysis.service';
import { ProjectsService } from '../projects/projects.service';
import { Octokit } from '@octokit/rest';

@Injectable()
export class TaskGithubItemsService {
    private readonly logger = new Logger(TaskGithubItemsService.name);

    constructor(
        private repository: TaskGithubItemsRepository,
        private tasksService: TasksService,
        private repositoriesService: RepositoriesService,
        private githubAppService: GithubAppService,
        private githubService: GithubService,
        private analysisService: AnalysisService,
        private projectsService: ProjectsService,
    ) { }

    /** Create (manually) a PR or Commit link to a task and trigger analysis */
    async create(taskId: number, dto: CreateTaskGithubItemDto, userId: number) {
        // Verify task access
        const task = await this.tasksService.findOne(taskId, userId);

        // Prevent duplicates
        const existing = await this.repository.findByTaskAndGithubId(taskId, dto.githubId);
        if (existing) {
            return existing;
        }

        const item = await this.repository.create({
            taskId,
            type: dto.type,
            githubId: dto.githubId,
            url: dto.url,
            title: dto.title,
            author: dto.author,
        });

        this.logger.log(`Created TaskGithubItem #${item.id} (${dto.type}) for task #${taskId}`);

        // Trigger analysis asynchronously (don't await — respond immediately)
        this.triggerAnalysis(item.id, task.projectId, userId).catch((err) =>
            this.logger.error(`Analysis failed for item #${item.id}: ${err.message}`),
        );

        return item;
    }

    /**
     * Create from webhook (no userId check — system context).
     * Used by GithubController webhook handler.
     */
    async createFromWebhook(data: {
        taskId: number;
        type: 'PULL_REQUEST' | 'COMMIT';
        githubId: string;
        url: string;
        title?: string;
        author?: string | null;
    }) {
        const { GithubItemType } = await import('@prisma/client');

        // Prevent duplicates
        const existing = await this.repository.findByTaskAndGithubId(data.taskId, data.githubId);
        if (existing) {
            this.logger.log(`GitHubItem already exists for task #${data.taskId} / githubId ${data.githubId}`);
            return existing;
        }

        const item = await this.repository.create({
            taskId: data.taskId,
            type: data.type === 'PULL_REQUEST' ? GithubItemType.PULL_REQUEST : GithubItemType.COMMIT,
            githubId: data.githubId,
            url: data.url,
            title: data.title,
            author: data.author ?? undefined,
        });

        this.logger.log(`[Webhook] Created TaskGithubItem #${item.id} (${data.type}) for task #${data.taskId}`);

        // Try find project for analysis — lookup via tasks repository
        // We do a best-effort analysis; if task not found we skip silently
        try {
            const repos = await this.repositoriesService.findAll(0, 0).catch(() => []);
            // Note: full analysis trigger needs projectId.
            // GithubController should pass projectId from the webhook payload (installation repos).
            // For now we store item and analysis will be triggered on next manual request.
        } catch (e) {
            this.logger.warn(`Skipping auto-analysis from webhook: ${e.message}`);
        }

        return item;
    }

    /** Get all linked PR/commits for a task */
    async findAllByTask(taskId: number, userId: number) {
        await this.tasksService.findOne(taskId, userId);
        return this.repository.findByTaskId(taskId);
    }

    /** Delete a linked PR/commit */
    async remove(id: number, userId: number) {
        const item = await this.repository.findById(id);
        if (!item) {
            throw new NotFoundException(`GitHub item with ID ${id} not found`);
        }

        // Verify task access
        await this.tasksService.findOne(item.taskId, userId);

        await this.repository.delete(id);
    }

    /** Get list of open PRs in project's repo (for manual linking UI) */
    async getProjectPullRequests(projectId: number, userId: number) {
        const token = await this.getInstallationTokenForProject(projectId, userId);
        const repos = await this.repositoriesService.findAll(projectId, userId);

        if (repos.length === 0) {
            throw new NotFoundException('No repository linked to this project');
        }

        const { owner, repo } = await this.githubService.getRepoDetailsById(
            repos[0].githubRepoId,
            token,
        );

        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'all',
            per_page: 30,
            sort: 'updated',
            direction: 'desc',
        });

        return data.map((pr) => ({
            type: GithubItemType.PULL_REQUEST,
            githubId: String(pr.number),
            url: pr.html_url,
            title: pr.title,
            author: pr.user?.login ?? null,
            state: pr.state,
            mergedAt: pr.merged_at,
        }));
    }

    /** Get list of recent commits in project's repo (for manual linking UI) */
    async getProjectCommits(projectId: number, userId: number) {
        const token = await this.getInstallationTokenForProject(projectId, userId);
        const repos = await this.repositoriesService.findAll(projectId, userId);

        if (repos.length === 0) {
            throw new NotFoundException('No repository linked to this project');
        }

        const { owner, repo } = await this.githubService.getRepoDetailsById(
            repos[0].githubRepoId,
            token,
        );

        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 30,
        });

        return data.map((c) => ({
            type: GithubItemType.COMMIT,
            githubId: c.sha,
            url: c.html_url,
            title: c.commit.message.split('\n')[0], // First line only
            author: c.author?.login ?? c.commit.author?.name ?? null,
        }));
    }

    /** Called internally (from webhook or manual create) to trigger ESLint analysis */
    async triggerAnalysis(githubItemId: number, projectId: number, userId: number) {
        const item = await this.repository.findById(githubItemId);
        if (!item) return;

        this.logger.log(`Triggering analysis for GitHubItem #${githubItemId} (${item.type})`);

        const score = await this.analysisService.analyzeGithubItem(
            item,
            projectId,
            userId,
        );

        if (score !== null) {
            await this.repository.updateScore(githubItemId, score);
            this.logger.log(`Score ${score} saved to GitHubItem #${githubItemId}`);
        }
    }

    /** Helper: resolve installation token for a project */
    private async getInstallationTokenForProject(projectId: number, userId: number): Promise<string | undefined> {
        const hasAccess = await this.projectsService.checkUserAccess(projectId, userId);
        if (!hasAccess) {
            throw new ForbiddenException('You are not a member of this project');
        }

        const repos = await this.repositoriesService.findAll(projectId, userId);
        if (repos.length === 0) return undefined;

        const tokenResult = await this.repositoriesService.getDecryptedToken(repos[0].id);
        if (tokenResult.isInstallationToken && tokenResult.token) {
            return this.githubAppService.getInstallationToken(BigInt(tokenResult.token));
        }

        return tokenResult.token ?? undefined;
    }
}
