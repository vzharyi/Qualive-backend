import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { UserId } from '../auth/decorators/user-id.decorator';
import { Task } from './entities/task.entity';
import { TaskStatus, TaskPriority } from '@prisma/client';

@Controller('tasks')
@ApiTags('Tasks')
@ApiBearerAuth()
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }



    @Get()
    @ApiOperation({ summary: 'Get tasks with filters and sorting' })
    @ApiQuery({ name: 'projectId', required: true, type: Number })
    @ApiQuery({ name: 'assigneeId', required: false, type: Number })
    @ApiQuery({ name: 'reporterId', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
    @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['createdAt', 'priority', 'status', 'updatedAt'],
    })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns filtered and sorted tasks',
        type: [Task],
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'You are not a member of this project',
    })
    findAll(@Query() filters: FilterTaskDto, @UserId() userId: number) {
        return this.tasksService.findAll(filters, userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get task by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns task details',
        type: Task,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Task not found',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied',
    })
    findOne(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
        return this.tasksService.findOne(id, userId);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update task (status, assignee, GitHub commit, etc.)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Task updated successfully',
        type: Task,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Assignee is not a member of this project',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTaskDto: UpdateTaskDto,
        @UserId() userId: number,
    ) {
        return this.tasksService.update(id, updateTaskDto, userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete task' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Task deleted successfully',
    })
    remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
        return this.tasksService.remove(id, userId);
    }
}
