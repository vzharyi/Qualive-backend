import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TasksService } from '../tasks/tasks.service';
import { User } from '@prisma/client';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class CommentsService {
    constructor(
        private repository: CommentsRepository,
        private tasksService: TasksService,
        private projectsService: ProjectsService,
    ) { }

    async create(userId: number, dto: CreateCommentDto) {
        // Check if task exists and user has access (using TasksService for consistency if available, or direct check)
        // For now, assuming standard access check is handled or we verify existence.
        // Ideally we should check if user is member of the project the task belongs to.
        // relying on simple check for now:
        await this.tasksService.findOne(dto.taskId, userId); // This usually throws if not found or no access

        return this.repository.create(userId, dto);
    }

    async findAllByTaskId(userId: number, taskId: number) {
        // Check access
        await this.tasksService.findOne(taskId, userId);
        return this.repository.findAllByTaskId(taskId);
    }

    async remove(userId: number, id: number) {
        const comment = await this.repository.findById(id);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Check permissions:
        // 1. Author can delete
        if (comment.userId === userId) {
            return this.repository.delete(id);
        }

        // 2. Project Owner can delete
        // Need to get project owner.
        const project = await this.projectsService.findOne(comment.task.projectId);
        if (project.ownerId === userId) {
            return this.repository.delete(id);
        }

        // 3. Project Admin (todo: check roles if implemented)

        throw new ForbiddenException('You can only delete your own comments or if you are the project owner');
    }
}
