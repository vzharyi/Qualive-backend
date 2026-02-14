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
import { plainToInstance } from 'class-transformer';
import { Task } from './entities/task.entity';
import { SERIALIZATION_GROUPS } from '../users/entities/user.entity';

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

        const newTask = await this.repository.create({
            ...createTaskDto,
            reporterId: userId,
            status: TaskStatus.TO_DO,
            priority: createTaskDto.priority || TaskPriority.MEDIUM,
        });

        return plainToInstance(Task, newTask, {
            groups: SERIALIZATION_GROUPS.PROJECT,
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

        const tasks = await this.repository.findAll(filters);

        return tasks.map((task) =>
            plainToInstance(Task, task, {
                groups: SERIALIZATION_GROUPS.PROJECT,
            }),
        );
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

        return plainToInstance(Task, task, {
            groups: SERIALIZATION_GROUPS.PROJECT,
        });
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

        const updatedTask = await this.repository.update(id, updateData);

        return plainToInstance(Task, updatedTask, {
            groups: SERIALIZATION_GROUPS.PROJECT,
        });
    }

    /** Delete task */
    async remove(id: number, userId: number) {
        await this.findOne(id, userId);
        await this.repository.delete(id);
    }
}
