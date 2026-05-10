import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsRepository } from '../projects.repository';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private projectsRepository: ProjectsRepository,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        let projectId = request.params.projectId ? parseInt(request.params.projectId) : null;

        // Try to find projectId from project route
        if (!projectId && request.params.id && request.route?.path?.includes('/projects/:id')) {
            projectId = parseInt(request.params.id);
        }

        // Try to find projectId from task route (by looking up task)
        if (!projectId && request.params.id && request.route?.path?.includes('/tasks/:id')) {
            const taskId = parseInt(request.params.id);
            const task = await this.prisma.task.findUnique({
                where: { id: taskId },
                select: { projectId: true }
            });
            if (task) {
                projectId = task.projectId;
            }
        }

        // Try to find projectId from column route
        if (!projectId && request.params.columnId) {
            const columnId = parseInt(request.params.columnId);
            const column = await this.prisma.boardColumn.findUnique({
                where: { id: columnId },
                select: { projectId: true }
            });
            if (column) {
                projectId = column.projectId;
            }
        }

        if (!userId) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!projectId) {
            return true;
        }

        const member = await this.projectsRepository.findMember(projectId, userId);

        if (!member) {
            throw new ForbiddenException('User is not a member of this project');
        }

        const hasRole = requiredRoles.includes(member.role);

        if (!hasRole) {
            throw new ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
