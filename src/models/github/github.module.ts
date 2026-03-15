import { Module, forwardRef } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubAppService } from './github.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectsModule } from '../projects/projects.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
        }),
        ConfigModule,
        ProjectsModule,
        RepositoriesModule,
    ],
    controllers: [GithubController],
    providers: [
        GithubAppService,
        {
            provide: 'TaskGithubItemsServiceToken',
            useValue: null, // Will be replaced at runtime by TaskGithubItemsModule export
        },
    ],
    exports: [GithubAppService, 'TaskGithubItemsServiceToken'],
})
export class GithubModule { }
