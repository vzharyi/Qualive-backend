import { Module } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesRepository } from './repositories.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { EncryptionService } from '../../common/encryption.service';

@Module({
    imports: [PrismaModule, ProjectsModule],
    controllers: [RepositoriesController],
    providers: [RepositoriesService, RepositoriesRepository, EncryptionService],
    exports: [RepositoriesService],
})
export class RepositoriesModule { }
