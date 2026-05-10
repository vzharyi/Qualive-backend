import { Project as PrismaProject, ProjectStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';

export class Project implements PrismaProject {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    description: string | null;

    @Expose()
    avatarUrl: string | null;

    @Expose()
    status: ProjectStatus;

    @Expose()
    ownerId: number;

    @Expose()
    defaultViewSettings: any;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    @Type(() => User)
    owner?: User;

    @Expose()
    @Type(() => ProjectMember)
    members?: ProjectMember[];
}
