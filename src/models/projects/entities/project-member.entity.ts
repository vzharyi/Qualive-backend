import { ProjectMember as PrismaProjectMember, ProjectRole } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

export class ProjectMember implements PrismaProjectMember {
    @Expose()
    projectId: number;

    @Expose()
    userId: number;

    @Expose()
    role: ProjectRole;

    @Expose()
    joinedAt: Date;

    @Expose()
    personalViewSettings: any;

    // Relations
    @Expose()
    @Type(() => User)
    user?: User;

    @Expose()
    @Type(() => Project)
    project?: Project;
}
