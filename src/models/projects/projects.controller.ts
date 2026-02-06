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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ProjectOwnerGuard } from './guards/project-owner.guard';
import { UserId } from '../auth/decorators/user-id.decorator';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';

@Controller('projects')
@ApiTags('Projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

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
