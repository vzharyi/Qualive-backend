import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ProjectsService } from '../projects/projects.service';

export const DEFAULT_COLUMNS = [
    { name: 'To Do', order: 0, color: null },
    { name: 'In Progress', order: 1, color: null },
    { name: 'Review', order: 2, color: null },
    { name: 'Done', order: 3, color: null },
];

@Injectable()
export class ColumnsService {
    constructor(
        private repository: ColumnsRepository,
        private projectsService: ProjectsService,
    ) { }

    /** Called internally when a project is created */
    async createDefaults(projectId: number) {
        return this.repository.createMany(projectId, DEFAULT_COLUMNS);
    }

    async create(projectId: number, dto: CreateColumnDto, userId: number) {
        await this.checkAccess(projectId, userId);
        return this.repository.create(projectId, dto);
    }

    async findAll(projectId: number, userId: number) {
        await this.checkAccess(projectId, userId);
        return this.repository.findAllByProject(projectId);
    }

    async update(projectId: number, columnId: number, dto: UpdateColumnDto, userId: number) {
        await this.checkAccess(projectId, userId);
        const column = await this.repository.findById(columnId);

        if (!column || column.projectId !== projectId) {
            throw new NotFoundException('Column not found in this project');
        }

        return this.repository.update(columnId, dto);
    }

    async remove(projectId: number, columnId: number, userId: number) {
        await this.checkAccess(projectId, userId);
        const column = await this.repository.findById(columnId);

        if (!column || column.projectId !== projectId) {
            throw new NotFoundException('Column not found in this project');
        }

        await this.repository.delete(columnId);
    }

    private async checkAccess(projectId: number, userId: number) {
        const hasAccess = await this.projectsService.checkUserAccess(projectId, userId);
        if (!hasAccess) {
            throw new ForbiddenException('You are not a member of this project');
        }
    }
}
