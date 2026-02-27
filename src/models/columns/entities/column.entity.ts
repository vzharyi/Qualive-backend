import { BoardColumn as PrismaBoardColumn } from '@prisma/client';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class Column implements PrismaBoardColumn {
    @Expose()
    @ApiProperty({ example: 1 })
    id: number;

    @Expose()
    @ApiProperty({ example: 1 })
    projectId: number;

    @Expose()
    @ApiProperty({ example: 'In Progress' })
    name: string;

    @Expose()
    @ApiProperty({ example: '#3498db', required: false })
    color: string | null;

    @Expose()
    @ApiProperty({ example: 2 })
    order: number;

    @Expose()
    @ApiProperty()
    createdAt: Date;

    @Expose()
    @ApiProperty()
    updatedAt: Date;
}
