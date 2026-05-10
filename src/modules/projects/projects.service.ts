import { plainToInstance } from 'class-transformer';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectStatus, ProjectRole } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ProjectsRepository } from './projects.repository';
import { UsersService } from '../users/users.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { SERIALIZATION_GROUPS } from '../users/entities/user.entity';
import { ColumnsRepository } from '../columns/columns.repository';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_COLUMNS = [
  { name: 'To Do', order: 0, color: null },
  { name: 'In Progress', order: 1, color: null },
  { name: 'Review', order: 2, color: null },
  { name: 'Done', order: 3, color: null },
];

@Injectable()
export class ProjectsService {
  constructor(
    private repository: ProjectsRepository,
    private usersService: UsersService,
    private columnsRepository: ColumnsRepository,
    private prisma: PrismaService,
  ) { }

  /** Create new project and automatically add creator as ADMIN in project_members */
  async create(createProjectDto: CreateProjectDto, ownerId: number): Promise<Project> {
    const { columns, ...projectData } = createProjectDto;

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        ownerId,
        status: ProjectStatus.ACTIVE,
      },
    });

    await this.repository.addMember(project.id, ownerId, ProjectRole.ADMIN);

    // Create default columns for the project
    const columnsToCreate = columns && columns.length > 0
      ? columns.map((col, index) => ({
        name: col.name,
        color: col.color || '#94a3b8',
        order: index,
        projectId: project.id,
      }))
      : DEFAULT_COLUMNS.map((col) => ({
        ...col,
        projectId: project.id,
      }));

    await this.columnsRepository.createMany(project.id, columnsToCreate);

    return project;
  }

  /** Get all projects for current user */
  async findAll(userId: number) {
    const projects = await this.repository.findUserProjects(userId);
    return projects.map((project) =>
      plainToInstance(Project, project, {
        groups: SERIALIZATION_GROUPS.PROJECT,
      }),
    );
  }

  /** Get project by ID with full information */
  async findOne(id: number) {
    const project = await this.repository.findById(id, true);

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return plainToInstance(Project, project, {
      groups: SERIALIZATION_GROUPS.PROJECT,
    });
  }

  /** Update project */
  async update(id: number, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);
    const updatedProject = await this.repository.update(id, updateProjectDto);

    return plainToInstance(Project, updatedProject, {
      groups: SERIALIZATION_GROUPS.PROJECT,
    });
  }

  /** Delete project */
  async remove(id: number) {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  /** Add member to project */
  async addMember(projectId: number, addMemberDto: AddMemberDto) {
    await this.findOne(projectId);

    let user;
    try {
      if (addMemberDto.email) {
        user = await this.usersService.findUserByEmail(addMemberDto.email);
      } else if (addMemberDto.userId) {
        user = await this.usersService.findUserById(addMemberDto.userId);
      } else {
        throw new BadRequestException('Either email or userId is required');
      }
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.repository.findMember(projectId, user.id);
    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    const newMember = await this.repository.addMember(projectId, user.id, addMemberDto.role);

    return plainToInstance(ProjectMember, newMember, {
      groups: SERIALIZATION_GROUPS.PROJECT,
    });
  }

  /** Remove member from project */
  async removeMember(projectId: number, userId: number) {
    const member = await this.repository.findMember(projectId, userId);

    if (!member) {
      throw new NotFoundException('Member not found in this project');
    }

    if (member.role === ProjectRole.ADMIN) {
      throw new ForbiddenException('Cannot remove project admin');
    }

    await this.repository.removeMember(projectId, userId);
  }

  /** Check if user has access to project */
  async checkUserAccess(projectId: number, userId: number): Promise<boolean> {
    const member = await this.repository.findMember(projectId, userId);
    return !!member;
  }

  /** Check if user is project owner */
  async checkUserIsOwner(projectId: number, userId: number): Promise<boolean> {
    const member = await this.repository.findMember(projectId, userId);
    return member?.role === ProjectRole.ADMIN;
  }
}
