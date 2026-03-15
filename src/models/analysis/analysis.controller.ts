import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { UserId } from '../auth/decorators/user-id.decorator';

@Controller('analysis')
@ApiTags('Analysis')
@ApiBearerAuth()
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Get('reports/:taskId')
    @ApiOperation({ summary: 'Get all analysis reports for a task (with defects and linked GitHub item)' })
    @ApiParam({ name: 'taskId', type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns all analysis reports for the task',
    })
    getReportsByTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @UserId() userId: number,
    ) {
        return this.analysisService.getReportsByTask(taskId, userId);
    }

    @Get('defects/:reportId')
    @ApiOperation({ summary: 'Get defects for a specific analysis report' })
    @ApiParam({ name: 'reportId', type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns all defects for the report',
    })
    getDefectsByReport(
        @Param('reportId', ParseIntPipe) reportId: number,
        @UserId() userId: number,
    ) {
        return this.analysisService.getDefectsByReport(reportId, userId);
    }
}
