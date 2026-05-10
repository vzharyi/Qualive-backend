import {
    Controller,
    Get,
    Post,
    Patch,
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
} from '@nestjs/swagger';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { Column } from './entities/column.entity';
import { UserId } from '../auth/decorators/user-id.decorator';

@Controller('projects/:projectId/columns')
@ApiTags('Columns')
@ApiBearerAuth()
export class ColumnsController {
    constructor(private readonly columnsService: ColumnsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all columns for a project (ordered)' })
    @ApiResponse({ status: HttpStatus.OK, description: 'List of columns', type: [Column] })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a project member' })
    findAll(
        @Param('projectId', ParseIntPipe) projectId: number,
        @UserId() userId: number,
    ) {
        return this.columnsService.findAll(projectId, userId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new column in project' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Column created', type: Column })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a project member' })
    create(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() dto: CreateColumnDto,
        @UserId() userId: number,
    ) {
        return this.columnsService.create(projectId, dto, userId);
    }

    @Patch(':columnId')
    @ApiOperation({ summary: 'Update column name or order' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Column updated', type: Column })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Column not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a project member' })
    update(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('columnId', ParseIntPipe) columnId: number,
        @Body() dto: UpdateColumnDto,
        @UserId() userId: number,
    ) {
        return this.columnsService.update(projectId, columnId, dto, userId);
    }

    @Delete(':columnId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a column' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Column deleted' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Column not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a project member' })
    remove(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('columnId', ParseIntPipe) columnId: number,
        @UserId() userId: number,
    ) {
        return this.columnsService.remove(projectId, columnId, userId);
    }
}
