import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsRepository {
    constructor(private prisma: PrismaService) { }

    async create(projectId: number, dto: CreateColumnDto) {
        return this.prisma.boardColumn.create({
            data: {
                projectId,
                name: dto.name,
                order: dto.order ?? 0,
            },
        });
    }

    async createMany(projectId: number, columns: { name: string; order: number }[]) {
        return this.prisma.boardColumn.createMany({
            data: columns.map((c) => ({ ...c, projectId })),
        });
    }

    async findAllByProject(projectId: number) {
        return this.prisma.boardColumn.findMany({
            where: { projectId },
            orderBy: { order: 'asc' },
        });
    }

    async findById(id: number) {
        return this.prisma.boardColumn.findUnique({ where: { id } });
    }

    async update(id: number, dto: UpdateColumnDto) {
        return this.prisma.boardColumn.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: number) {
        await this.prisma.boardColumn.delete({ where: { id } });
    }
}
