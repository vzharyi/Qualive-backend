import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: Partial<User>): Promise<User> {
    return this.prisma.user.create({
      data: data as any,
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { login },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByLoginOrEmail(login: string, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ login }, { email }],
      },
    });
  }

  async update(id: number, updateData: Partial<User>): Promise<User | null> {
    return this.prisma.user.update({
      where: { id },
      data: updateData as any,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByField(field: string, value: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { [field]: value } as any,
    });
  }
}
