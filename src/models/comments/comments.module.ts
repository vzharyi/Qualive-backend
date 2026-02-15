import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
    imports: [PrismaModule, TasksModule, ProjectsModule],
    controllers: [CommentsController],
    providers: [CommentsService, CommentsRepository],
    exports: [CommentsService],
})
export class CommentsModule { }
