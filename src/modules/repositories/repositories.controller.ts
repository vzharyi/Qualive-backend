import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { UserId } from '../auth/decorators/user-id.decorator';
import { Repository } from './entities/repository.entity';

@Controller('repositories')
@ApiTags('Repositories')
@ApiBearerAuth()
export class RepositoriesController {
    constructor(private readonly repositoriesService: RepositoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Link GitHub repository to project' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Repository linked successfully. Access token is encrypted.',
        type: Repository,
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only project owner can link repositories',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'This GitHub repository is already linked',
    })
    create(
        @Body() createRepositoryDto: CreateRepositoryDto,
        @UserId() userId: number,
    ) {
        return this.repositoriesService.create(createRepositoryDto, userId);
    }

    @Get('project/:projectId')
    @ApiOperation({ summary: 'Get all repositories for a project' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns all repositories linked to the project',
        type: [Repository],
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'You are not a member of this project',
    })
    findAll(
        @Param('projectId', ParseIntPipe) projectId: number,
        @UserId() userId: number,
    ) {
        return this.repositoriesService.findAll(projectId, userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get repository by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns repository details',
        type: Repository,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Repository not found',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied',
    })
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @UserId() userId: number,
    ) {
        return this.repositoriesService.findOne(id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update repository (owner only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Repository updated successfully',
        type: Repository,
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only project owner can update repositories',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRepositoryDto: UpdateRepositoryDto,
        @UserId() userId: number,
    ) {
        return this.repositoriesService.update(id, updateRepositoryDto, userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Unlink repository from project (owner only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Repository unlinked successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only project owner can remove repositories',
    })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @UserId() userId: number,
    ) {
        return this.repositoriesService.remove(id, userId);
    }
}
