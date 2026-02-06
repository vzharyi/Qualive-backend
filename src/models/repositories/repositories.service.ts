import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { RepositoriesRepository } from './repositories.repository';
import { ProjectsService } from '../projects/projects.service';
import { EncryptionService } from '../../common/encryption.service';

@Injectable()
export class RepositoriesService {
    constructor(
        private repository: RepositoriesRepository,
        private projectsService: ProjectsService,
        private encryptionService: EncryptionService,
    ) { }

    /** Link GitHub repository to project. Access token is encrypted before saving */
    async create(createRepositoryDto: CreateRepositoryDto, userId: number) {
        const isOwner = await this.projectsService.checkUserIsOwner(
            createRepositoryDto.projectId,
            userId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'Only project owner can link repositories',
            );
        }

        const existing = await this.repository.findByGithubRepoId(
            createRepositoryDto.githubRepoId,
        );

        if (existing) {
            throw new ConflictException(
                'This GitHub repository is already linked to a project',
            );
        }

        let encryptedToken: string | null = null;
        if (createRepositoryDto.accessToken) {
            encryptedToken = this.encryptionService.encrypt(
                createRepositoryDto.accessToken,
            );
        }

        return this.repository.create({
            projectId: createRepositoryDto.projectId,
            githubRepoId: createRepositoryDto.githubRepoId,
            accessToken: encryptedToken,
        });
    }

    /** Get all repositories for a project */
    async findAll(projectId: number, userId: number) {
        const hasAccess = await this.projectsService.checkUserAccess(
            projectId,
            userId,
        );

        if (!hasAccess) {
            throw new ForbiddenException('You are not a member of this project');
        }

        return this.repository.findByProjectId(projectId);
    }

    /** Get repository by ID */
    async findOne(id: number, userId: number) {
        const repo = await this.repository.findById(id, true);

        if (!repo) {
            throw new NotFoundException(`Repository with ID ${id} not found`);
        }

        const hasAccess = await this.projectsService.checkUserAccess(
            repo.projectId,
            userId,
        );

        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        return repo;
    }

    /** Update repository */
    async update(
        id: number,
        updateRepositoryDto: UpdateRepositoryDto,
        userId: number,
    ) {
        const repo = await this.findOne(id, userId);

        const isOwner = await this.projectsService.checkUserIsOwner(
            repo.projectId,
            userId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'Only project owner can update repositories',
            );
        }

        if (
            updateRepositoryDto.githubRepoId &&
            updateRepositoryDto.githubRepoId !== repo.githubRepoId
        ) {
            const existing = await this.repository.findByGithubRepoId(
                updateRepositoryDto.githubRepoId,
            );

            if (existing) {
                throw new ConflictException(
                    'This GitHub repository is already linked',
                );
            }
        }

        const updateData: any = { ...updateRepositoryDto };
        if (updateRepositoryDto.accessToken) {
            updateData.accessToken = this.encryptionService.encrypt(
                updateRepositoryDto.accessToken,
            );
        }

        delete updateData.projectId;

        return this.repository.update(id, updateData);
    }

    /** Unlink repository from project */
    async remove(id: number, userId: number) {
        const repo = await this.findOne(id, userId);

        const isOwner = await this.projectsService.checkUserIsOwner(
            repo.projectId,
            userId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'Only project owner can remove repositories',
            );
        }

        await this.repository.delete(id);
    }

    /** Get decrypted access token. IMPORTANT: For internal use only! DO NOT expose via API! */
    async getDecryptedToken(id: number): Promise<string | null> {
        const repo = await this.repository.findById(id);

        if (!repo || !repo.accessToken) {
            return null;
        }

        try {
            return this.encryptionService.decrypt(repo.accessToken);
        } catch (error) {
            throw new BadRequestException('Failed to decrypt access token');
        }
    }
}
