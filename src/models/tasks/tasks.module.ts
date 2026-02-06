import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
    imports: [PrismaModule, ProjectsModule],
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
    exports: [TasksService],
})
export class TasksModule { }
