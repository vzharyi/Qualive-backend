import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ProjectOwnerGuard } from './guards/project-owner.guard';
import { UserId } from '../auth/decorators/user-id.decorator';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';

import { TasksService } from '../tasks/tasks.service';
import { CreateTaskInProjectDto } from './dto/create-task-in-project.dto';
import { Task } from '../tasks/entities/task.entity';

@Controller('projects')
@ApiTags('Projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) { }

  @Post(':id/tasks')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Create new task in project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task created successfully',
    type: Task,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not a member of this project',
  })
  createTask(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() createTaskDto: CreateTaskInProjectDto,
    @UserId() userId: number,
  ) {
    return this.tasksService.create(
      { ...createTaskDto, projectId },
      userId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create new project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project created successfully. Creator is automatically added as ADMIN.',
    type: Project,
  })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @UserId() userId: number,
  ) {
    return this.projectsService.create(createProjectDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my projects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all projects where user is a member',
    type: [Project],
  })
  findAll(@UserId() userId: number) {
    return this.projectsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns project details with members',
    type: Project,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not a member of this project',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProjectOwnerGuard)
  @ApiOperation({ summary: 'Update project (owner only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project updated successfully',
    type: Project,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only project owner can update the project',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Post(':id/avatar')
  @UseGuards(ProjectOwnerGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `project-${req.params.id}-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  @ApiOperation({ summary: 'Upload project avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar uploaded successfully',
    type: Project,
  })
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const avatarUrl = `${backendUrl}/uploads/avatars/${file.filename}`;

    return this.projectsService.update(id, { avatarUrl });
  }

  @Delete(':id')
  @UseGuards(ProjectOwnerGuard)
  @ApiOperation({ summary: 'Delete project (owner only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only project owner can delete the project',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  // Member management endpoints

  @Post(':id/members')
  @UseGuards(ProjectOwnerGuard)
  @ApiOperation({ summary: 'Add member to project (owner only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Member added successfully',
    type: ProjectMember,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a member',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.projectsService.addMember(id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ProjectOwnerGuard)
  @ApiOperation({ summary: 'Remove member from project (owner only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot remove project admin',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Member not found',
  })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectsService.removeMember(id, userId);
  }
}
