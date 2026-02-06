import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { TasksRepository } from './tasks.repository';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class TasksService {
    constructor(
        private repository: TasksRepository,
        private projectsService: ProjectsService,
    ) { }

    /** Create new task with reporter set automatically from userId */
    async create(createTaskDto: CreateTaskDto, userId: number) {
        const hasAccess = await this.projectsService.checkUserAccess(
            createTaskDto.projectId,
            userId,
        );

        if (!hasAccess) {
            throw new ForbiddenException('You are not a member of this project');
        }

        if (createTaskDto.assigneeId) {
            const assigneeHasAccess = await this.projectsService.checkUserAccess(
                createTaskDto.projectId,
                createTaskDto.assigneeId,
            );

            if (!assigneeHasAccess) {
                throw new BadRequestException(
                    'Assignee is not a member of this project',
                );
            }
        }

        return this.repository.create({
            ...createTaskDto,
            reporterId: userId,
            status: TaskStatus.TO_DO,
            priority: createTaskDto.priority || TaskPriority.MEDIUM,
        });
    }

    /** Get tasks with filtering and sorting */
    async findAll(filters: FilterTaskDto, userId: number) {
        const hasAccess = await this.projectsService.checkUserAccess(
            filters.projectId,
            userId,
        );

        if (!hasAccess) {
            throw new ForbiddenException('You are not a member of this project');
        }

        return this.repository.findAll(filters);
    }

    /** Get task by ID */
    async findOne(id: number, userId: number) {
        const task = await this.repository.findById(id);

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }

        const hasAccess = await this.projectsService.checkUserAccess(
            task.projectId,
            userId,
        );

        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        return task;
    }

    /** Update task (status, assignee, GitHub commit, etc.) */
    async update(id: number, updateTaskDto: UpdateTaskDto, userId: number) {
        const task = await this.findOne(id, userId);

        if (updateTaskDto.assigneeId !== undefined) {
            if (updateTaskDto.assigneeId !== null) {
                const assigneeHasAccess = await this.projectsService.checkUserAccess(
                    task.projectId,
                    updateTaskDto.assigneeId,
                );

                if (!assigneeHasAccess) {
                    throw new BadRequestException(
                        'Assignee is not a member of this project',
                    );
                }
            }
        }

        const { projectId, ...updateData } = updateTaskDto as any;

        return this.repository.update(id, updateData);
    }

    /** Delete task */
    async remove(id: number, userId: number) {
        await this.findOne(id, userId);
        await this.repository.delete(id);
    }
}
