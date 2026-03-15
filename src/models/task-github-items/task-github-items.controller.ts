import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { TaskGithubItemsService } from './task-github-items.service';
import { CreateTaskGithubItemDto } from './dto/create-task-github-item.dto';
import { TaskGithubItem } from './entities/task-github-item.entity';
import { UserId } from '../auth/decorators/user-id.decorator';

@Controller()
@ApiTags('Task GitHub Items')
@ApiBearerAuth()
export class TaskGithubItemsController {
    constructor(private readonly service: TaskGithubItemsService) { }

    // ── Ручное управление PR/коммитами внутри таски ────────────────────────

    @Post('tasks/:taskId/github-items')
    @ApiOperation({ summary: 'Manually link a PR or commit to a task' })
    @ApiParam({ name: 'taskId', type: Number })
    @ApiResponse({ status: HttpStatus.CREATED, type: TaskGithubItem })
    create(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() dto: CreateTaskGithubItemDto,
        @UserId() userId: number,
    ) {
        return this.service.create(taskId, dto, userId);
    }

    @Get('tasks/:taskId/github-items')
    @ApiOperation({ summary: 'Get all linked PRs and commits for a task' })
    @ApiParam({ name: 'taskId', type: Number })
    @ApiResponse({ status: HttpStatus.OK, type: [TaskGithubItem] })
    findAll(
        @Param('taskId', ParseIntPipe) taskId: number,
        @UserId() userId: number,
    ) {
        return this.service.findAllByTask(taskId, userId);
    }

    @Delete('github-items/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Unlink a PR or commit from a task' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @UserId() userId: number,
    ) {
        return this.service.remove(id, userId);
    }

    // ── Получение списков с GitHub для выбора в UI ─────────────────────────

    @Get('projects/:projectId/github/pull-requests')
    @ApiOperation({ summary: 'Get recent PRs from the project repository for manual linking' })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Array of PRs from GitHub',
    })
    getProjectPullRequests(
        @Param('projectId', ParseIntPipe) projectId: number,
        @UserId() userId: number,
    ) {
        return this.service.getProjectPullRequests(projectId, userId);
    }

    @Get('projects/:projectId/github/commits')
    @ApiOperation({ summary: 'Get recent commits from the project repository for manual linking' })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Array of commits from GitHub',
    })
    getProjectCommits(
        @Param('projectId', ParseIntPipe) projectId: number,
        @UserId() userId: number,
    ) {
        return this.service.getProjectCommits(projectId, userId);
    }
}
