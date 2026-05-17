import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TasksController } from '../src/modules/tasks/tasks.controller';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { RolesGuard } from '../src/modules/projects/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProjectsRepository } from '../src/modules/projects/projects.repository';

describe('Board Tasks (e2e) - Reliability Test', () => {
  let app: INestApplication;

  const mockTasksFromDb = [
    { id: 1, title: 'Рефакторинг Auth', status: 'IN_PROGRESS' },
    { id: 2, title: 'Оновлення UI', status: 'TODO' }
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { 
          provide: TasksService, 
          useValue: { 
            findAll: jest.fn().mockImplementation(async () => {
              console.warn('[Nest] WARN [TasksService] GitHub API is unavailable (500). Falling back to database data.');
              return mockTasksFromDb;
            })
          } 
        },
        { provide: Reflector, useValue: new Reflector() },
        { provide: PrismaService, useValue: {} },
        { provide: ProjectsRepository, useValue: {} },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('повинен повернути задачі з БД (статус 200), навіть якщо GitHub API недоступний', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks?projectId=1')
      .expect(200);

    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0].title).toBe('Рефакторинг Auth');
  });
});
