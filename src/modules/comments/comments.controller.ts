import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../auth/decorators/user-id.decorator';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new comment' })
    create(@UserId() userId: number, @Body() createCommentDto: CreateCommentDto) {
        return this.commentsService.create(userId, createCommentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get comments by task ID' })
    @ApiQuery({ name: 'taskId', required: true, type: Number })
    findAll(@UserId() userId: number, @Query('taskId', ParseIntPipe) taskId: number) {
        return this.commentsService.findAllByTaskId(userId, taskId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a comment' })
    remove(@UserId() userId: number, @Param('id', ParseIntPipe) id: number) {
        return this.commentsService.remove(userId, id);
    }
}
