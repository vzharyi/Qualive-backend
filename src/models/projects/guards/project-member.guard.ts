import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from '../projects.service';

/** Guard to check if user is a project member. Applied to endpoints requiring project access */
@Injectable()
export class ProjectMemberGuard implements CanActivate {
    constructor(private projectsService: ProjectsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        const projectId = +request.params.id || +request.params.projectId;

        if (!userId || !projectId) {
            throw new ForbiddenException('Access denied');
        }

        const hasAccess = await this.projectsService.checkUserAccess(projectId, userId);

        if (!hasAccess) {
            throw new ForbiddenException('You are not a member of this project');
        }

        return true;
    }
}
