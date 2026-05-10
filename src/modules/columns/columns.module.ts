import { Module, forwardRef } from '@nestjs/common';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { ColumnsRepository } from './columns.repository';
import { ProjectsModule } from '../projects/projects.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjectsModule)],
    controllers: [ColumnsController],
    providers: [ColumnsService, ColumnsRepository],
    exports: [ColumnsService, ColumnsRepository],
})
export class ColumnsModule { }
