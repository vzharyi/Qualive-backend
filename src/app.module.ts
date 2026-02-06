import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './models/users/users.module';
import { ProjectsModule } from './models/projects/projects.module';
import { TasksModule } from './models/tasks/tasks.module';
import { AuthModule } from './models/auth/auth.module';
import { RepositoriesModule } from './models/repositories/repositories.module';
import { AnalysisModule } from './models/analysis/analysis.module';
import { JwtAuthGuard } from './models/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    AuthModule,
    RepositoriesModule,
    AnalysisModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
