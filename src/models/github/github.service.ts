import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ProjectsService } from '../projects/projects.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { Octokit } from '@octokit/rest';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GithubAppService {
    private readonly logger = new Logger(GithubAppService.name);

    constructor(
        private configService: ConfigService,
        private jwtService: JwtService,
        private projectsService: ProjectsService,
        private repositoriesService: RepositoriesService,
    ) { }

    async getInstallUrl(projectId: number, userId: number): Promise<string> {
        const isOwner = await this.projectsService.checkUserIsOwner(projectId, userId);
        if (!isOwner) {
            throw new ForbiddenException('Only project owner can link repositories');
        }

        const appSlug = this.configService.get<string>('GITHUB_APP_SLUG');
        if (!appSlug) {
            throw new BadRequestException('GITHUB_APP_SLUG is not configured');
        }

        const stateToken = this.jwtService.sign({ projectId, userId });

        return `https://github.com/apps/${appSlug}/installations/new?state=${stateToken}`;
    }

    async handleCallback(installationIdStr: string, stateToken: string): Promise<number> {
        try {
            const payload = this.jwtService.verify(stateToken);
            const { projectId, userId } = payload;

            const installationId = BigInt(installationIdStr);

            const token = await this.getInstallationToken(installationId);
            const octokit = new Octokit({ auth: token });

            const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();

            this.logger.log(`Found ${data.repositories.length} repositories for installation ${installationIdStr}`);

            for (const repo of data.repositories) {
                try {
                    await this.repositoriesService.create({
                        projectId,
                        githubRepoId: repo.id,
                    }, userId, installationId);
                } catch (error) {
                    this.logger.warn(`Failed to save repo ${repo.id} (might already exist)`);
                }
            }

            return projectId;
        } catch (error) {
            this.logger.error(`Error handling callback: ${error.message}`);
            throw new BadRequestException('Invalid state token or failed to fetch repositories');
        }
    }

    async getInstallationToken(installationId: bigint): Promise<string> {
        const appId = this.configService.get<string>('GITHUB_APP_ID');
        let privateKey = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY');

        if (!appId || !privateKey) {
            throw new Error('GitHub App credentials are not configured');
        }

        privateKey = privateKey.replace(/\\n/g, '\n');

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iat: now - 60,
            exp: now + (9 * 60),
            iss: appId,
        };

        const appJwt = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        const octokit = new Octokit({ auth: appJwt });

        try {
            const { data } = await octokit.rest.apps.createInstallationAccessToken({
                installation_id: Number(installationId),
            });
            return data.token;
        } catch (error) {
            this.logger.error(`Failed to create installation access token: ${error.message}`);
            throw new Error(`GitHub API error: ${error.message}`);
        }
    }

    /**
     * Handle incoming GitHub webhook events.
     * Extracts task ID from PR title or commit message using #<number> pattern.
     * Returns array of {taskId, githubId, type, url, title, author} for each match found.
     */
    async handleWebhook(event: string, payload: any): Promise<void> {
        this.logger.log(`Received GitHub webhook: ${event}`);

        if (event === 'pull_request') {
            await this.handlePullRequestEvent(payload);
        } else if (event === 'push') {
            await this.handlePushEvent(payload);
        } else {
            this.logger.log(`Ignoring webhook event: ${event}`);
        }
    }

    /**
     * Extract task IDs from text using pattern: #12, Task-12, TASK-12
     */
    extractTaskIds(text: string): number[] {
        const matches = [...text.matchAll(/#(\d+)|[Tt]ask[-_](\d+)/g)];
        return matches.map((m) => parseInt(m[1] || m[2], 10));
    }

    /**
     * Handle pull_request event.
     * Returns list of items to create (caller — TaskGithubItemsService via webhook).
     */
    private async handlePullRequestEvent(payload: any): Promise<void> {
        const action = payload.action; // opened, closed, synchronize, reopened

        // We react on: opened, reopened, closed (merged)
        if (!['opened', 'reopened', 'closed'].includes(action)) {
            return;
        }

        const pr = payload.pull_request;
        if (!pr) return;

        const title = pr.title || '';
        const body = pr.body || '';
        const fullText = `${title} ${body}`;

        const taskIds = this.extractTaskIds(fullText);

        if (taskIds.length === 0) {
            this.logger.log(`No task IDs found in PR #${pr.number} title/body`);
            return;
        }

        this.logger.log(`PR #${pr.number} matched task IDs: ${taskIds.join(', ')}`);

        // Emit an event that TaskGithubItemsService will handle
        // (We use a simple approach: store in a public property for the webhook handler)
        this._lastWebhookItems = taskIds.map((taskId) => ({
            taskId,
            type: 'PULL_REQUEST' as const,
            githubId: String(pr.number),
            url: pr.html_url,
            title: pr.title,
            author: pr.user?.login ?? null,
        }));
    }

    /**
     * Handle push event — catches direct commits to any branch (including main).
     */
    private async handlePushEvent(payload: any): Promise<void> {
        const commits: any[] = payload.commits || [];

        if (commits.length === 0) return;

        const items: any[] = [];

        for (const commit of commits) {
            const message = commit.message || '';
            const taskIds = this.extractTaskIds(message);

            if (taskIds.length === 0) continue;

            this.logger.log(`Commit ${commit.id} matched task IDs: ${taskIds.join(', ')}`);

            for (const taskId of taskIds) {
                items.push({
                    taskId,
                    type: 'COMMIT' as const,
                    githubId: commit.id, // Full SHA
                    url: commit.url,
                    title: message.split('\n')[0], // First line
                    author: commit.author?.username ?? commit.author?.name ?? null,
                });
            }
        }

        this._lastWebhookItems = items;
    }

    /**
     * Temporary storage for webhook-extracted items.
     * GithubController reads this after calling handleWebhook.
     */
    _lastWebhookItems: Array<{
        taskId: number;
        type: 'PULL_REQUEST' | 'COMMIT';
        githubId: string;
        url: string;
        title: string;
        author: string | null;
    }> = [];
}
