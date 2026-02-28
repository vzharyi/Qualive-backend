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

            // Fetch repos using installation token
            const token = await this.getInstallationToken(installationId);
            const octokit = new Octokit({ auth: token });

            // Fetch accessible repos for this installation
            const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();

            this.logger.log(`Found ${data.repositories.length} repositories for installation ${installationIdStr}`);

            // Save them to DB
            for (const repo of data.repositories) {
                try {
                    await this.repositoriesService.create({
                        projectId,
                        githubRepoId: repo.id,
                        // accessToken can be omitted since we use installationId
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

        // Replace literal \n with actual newlines if present
        privateKey = privateKey.replace(/\\n/g, '\n');

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iat: now - 60,
            exp: now + (9 * 60), // GitHub allowed max is 10 min, using 9 to avoid clock drift issues
            iss: appId,
        };

        const appJwt = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        const octokit = new Octokit({ auth: appJwt });

        try {
            const { data } = await octokit.rest.apps.createInstallationAccessToken({
                installation_id: Number(installationId)
            });
            return data.token;
        } catch (error) {
            this.logger.error(`Failed to create installation access token: ${error.message}`);
            throw new Error(`GitHub API error: ${error.message}`);
        }
    }
}
