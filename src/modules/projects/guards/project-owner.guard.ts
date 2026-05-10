import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from '../projects.service';

/** Guard to check if user is project owner (ADMIN). Applied to endpoints requiring owner privileges */
@Injectable()
export class ProjectOwnerGuard implements CanActivate {
    constructor(private projectsService: ProjectsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        const projectId = +request.params.id || +request.params.projectId;

        if (!userId || !projectId) {
            throw new ForbiddenException('Access denied');
        }

        const isOwner = await this.projectsService.checkUserIsOwner(projectId, userId);

        if (!isOwner) {
            throw new ForbiddenException('Only project owner (ADMIN) can perform this action');
        }

        return true;
    }
}
