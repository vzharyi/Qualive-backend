import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuthModule } from './modules/auth/auth.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ColumnsModule } from './modules/columns/columns.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { GithubModule } from './modules/github/github.module';
import { TaskGithubItemsModule } from './modules/task-github-items/task-github-items.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    AuthModule,
    RepositoriesModule,
    AnalysisModule,
    CommentsModule,
    ColumnsModule,
    GithubModule,
    TaskGithubItemsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
