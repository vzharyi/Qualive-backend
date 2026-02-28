import {
    Controller,
    Get,
    Query,
    Res,
    ParseIntPipe,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { GithubAppService } from './github.service';
import { UserId } from '../auth/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('github')
@ApiTags('GitHub App Integration')
export class GithubController {
    constructor(
        private readonly githubAppService: GithubAppService,
        private configService: ConfigService,
    ) { }

    @Get('install')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Returns URL to GitHub App Installation page' })
    async install(
        @Query('projectId', ParseIntPipe) projectId: number,
        @UserId() userId: number,
    ) {
        const url = await this.githubAppService.getInstallUrl(projectId, userId);
        return { url };
    }

    @Public()
    @Get('callback')
    @ApiOperation({ summary: 'Handles callback from GitHub App Installation' })
    async callback(
        @Query('installation_id') installationId: string,
        @Query('setup_action') setupAction: string,
        @Query('state') state: string,
        @Res() res: Response,
    ) {
        let frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        if (!state) {
            return res.redirect(`${frontendUrl}?error=missing_state`);
        }

        try {
            const projectId = await this.githubAppService.handleCallback(
                installationId,
                state,
            );
            return res.redirect(`${frontendUrl}/projects/${projectId}?github=connected`);
        } catch (error) {
            return res.redirect(`${frontendUrl}?error=github_setup_failed`);
        }
    }
}
