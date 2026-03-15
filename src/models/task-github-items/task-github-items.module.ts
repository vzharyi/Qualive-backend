import { Module, forwardRef } from '@nestjs/common';
import { TaskGithubItemsController } from './task-github-items.controller';
import { TaskGithubItemsService } from './task-github-items.service';
import { TaskGithubItemsRepository } from './task-github-items.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { GithubModule } from '../github/github.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
    imports: [
        PrismaModule,
        TasksModule,
        RepositoriesModule,
        forwardRef(() => GithubModule),
        AnalysisModule,
        ProjectsModule,
    ],
    controllers: [TaskGithubItemsController],
    providers: [
        TaskGithubItemsService,
        TaskGithubItemsRepository,
        {
            provide: 'TaskGithubItemsServiceToken',
            useExisting: TaskGithubItemsService,
        },
    ],
    exports: [TaskGithubItemsService, 'TaskGithubItemsServiceToken'],
})
export class TaskGithubItemsModule { }
