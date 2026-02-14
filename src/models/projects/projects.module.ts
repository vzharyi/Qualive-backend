import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ProjectOwnerGuard } from './guards/project-owner.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

import { TasksModule } from '../tasks/tasks.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [PrismaModule, UsersModule, forwardRef(() => TasksModule)],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectsRepository,
    ProjectMemberGuard,
    ProjectOwnerGuard,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule { }
