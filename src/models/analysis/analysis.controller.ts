import {
    Controller,
    Post,
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
import { AnalysisReport } from './entities/analysis-report.entity';
import { Defect } from './entities/defect.entity';

@Controller('analysis')
@ApiTags('Analysis')
@ApiBearerAuth()
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Post('analyze/:taskId')
    @ApiOperation({ summary: 'Analyze task code quality' })
    @ApiParam({ name: 'taskId', type: Number })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Analysis completed successfully',
        type: AnalysisReport,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Task has no GitHub commit or lines of code',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'No repository linked to project',
    })
    analyzeTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @UserId() userId: number,
    ) {
        return this.analysisService.analyzeTask(taskId, userId);
    }

    @Get('reports/:taskId')
    @ApiOperation({ summary: 'Get analysis reports for task' })
    @ApiParam({ name: 'taskId', type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns all analysis reports for the task',
        type: [AnalysisReport],
    })
    getReportsByTask(
        @Param('taskId', ParseIntPipe) taskId: number,
        @UserId() userId: number,
    ) {
        return this.analysisService.getReportsByTask(taskId, userId);
    }

    @Get('defects/:reportId')
    @ApiOperation({ summary: 'Get defects for analysis report' })
    @ApiParam({ name: 'reportId', type: Number })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns all defects for the report',
        type: [Defect],
    })
    getDefectsByReport(
        @Param('reportId', ParseIntPipe) reportId: number,
        @UserId() userId: number,
    ) {
        return this.analysisService.getDefectsByReport(reportId, userId);
    }
}
