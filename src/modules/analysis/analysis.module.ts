import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { AnalysisRepository } from './analysis.repository';
import { GithubService } from './services/github.service';
import { EslintService } from './services/eslint.service';
import { ScoringService } from './services/scoring.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { GithubModule } from '../github/github.module';

@Module({
    imports: [PrismaModule, TasksModule, RepositoriesModule, GithubModule],
    controllers: [AnalysisController],
    providers: [
        AnalysisService,
        AnalysisRepository,
        GithubService,
        EslintService,
        ScoringService,
    ],
    exports: [AnalysisService, GithubService],
})
export class AnalysisModule { }
