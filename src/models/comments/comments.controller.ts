import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new comment' })
    create(@Request() req, @Body() createCommentDto: CreateCommentDto) {
        return this.commentsService.create(req.user.id, createCommentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get comments by task ID' })
    @ApiQuery({ name: 'taskId', required: true, type: Number })
    findAll(@Request() req, @Query('taskId', ParseIntPipe) taskId: number) {
        return this.commentsService.findAllByTaskId(req.user.id, taskId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a comment' })
    remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.commentsService.remove(req.user.id, id);
    }
}
