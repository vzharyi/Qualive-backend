import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

export interface CommitFile {
    filename: string;
    content: string;
    additions: number;
    deletions: number;
    changes: number;
}

@Injectable()
export class GithubService {
    private readonly logger = new Logger(GithubService.name);

    /** Fetch commit files with their content from GitHub */
    async getCommitFiles(
        owner: string,
        repo: string,
        commitSha: string,
        accessToken?: string,
    ): Promise<CommitFile[]> {
        const octokit = accessToken
            ? new Octokit({ auth: accessToken })
            : new Octokit();

        try {
            const { data: commit } = await octokit.rest.repos.getCommit({
                owner,
                repo,
                ref: commitSha,
            });

            this.logger.log(
                `Fetched commit ${commitSha} with ${commit.files?.length || 0} files`,
            );

            const jstsFiles =
                commit.files?.filter((file) =>
                    /\.(js|jsx|ts|tsx)$/.test(file.filename),
                ) || [];

            this.logger.log(`Found ${jstsFiles.length} JS/TS files`);

            const filesWithContent = await Promise.all(
                jstsFiles.map(async (file) => {
                    if (file.status === 'removed') {
                        return null;
                    }

                    try {
                        const content = await this.getFileContent(
                            owner,
                            repo,
                            file.filename,
                            commitSha,
                            accessToken,
                        );

                        return {
                            filename: file.filename,
                            content,
                            additions: file.additions || 0,
                            deletions: file.deletions || 0,
                            changes: file.changes || 0,
                        };
                    } catch (error) {
                        this.logger.warn(
                            `Failed to fetch content for ${file.filename}: ${error.message}`,
                        );
                        return null;
                    }
                }),
            );

            return filesWithContent.filter((f) => f !== null) as CommitFile[];
        } catch (error) {
            this.logger.error(`Failed to fetch commit: ${error.message}`);
            throw new Error(`GitHub API error: ${error.message}`);
        }
    }

    /** Get file content from GitHub repository */
    private async getFileContent(
        owner: string,
        repo: string,
        path: string,
        ref: string,
        accessToken?: string,
    ): Promise<string> {
        const octokit = accessToken
            ? new Octokit({ auth: accessToken })
            : new Octokit();

        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        if ('content' in data && data.content) {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }

        throw new Error('File content not found');
    }

    /** Parse GitHub URL into owner and repo name */
    parseGithubUrl(url: string): { owner: string; repo: string } {
        const httpsMatch = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (httpsMatch) {
            return { owner: httpsMatch[1], repo: httpsMatch[2] };
        }

        const sshMatch = url.match(/github\.com:([^\/]+)\/([^\.]+)/);
        if (sshMatch) {
            return { owner: sshMatch[1], repo: sshMatch[2] };
        }

        throw new Error('Invalid GitHub URL format');
    }
}
