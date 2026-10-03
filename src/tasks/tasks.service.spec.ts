import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role, TaskPriority, TaskStatus } from '@prisma/client';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  const prisma = {
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const projectsService = { canManageProject: jest.fn() };
  const usersService = { findOne: jest.fn() };

  const member: AuthenticatedUser = {
    id: 'member-1',
    email: 'member@example.com',
    role: Role.MEMBER,
  };
  const manager: AuthenticatedUser = {
    id: 'manager-1',
    email: 'manager@example.com',
    role: Role.MANAGER,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectsService, useValue: projectsService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  it('forbids creating a task when the user cannot manage the project', async () => {
    projectsService.canManageProject.mockResolvedValue(false);

    await expect(
      service.create({ title: 'Task', projectId: 'project-1' }, member),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a task when the user manages the project', async () => {
    projectsService.canManageProject.mockResolvedValue(true);
    prisma.task.create.mockResolvedValue({ id: 'task-1' });

    await service.create({ title: 'Task', projectId: 'project-1' }, manager);

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: 'project-1' }),
      }),
    );
  });

  it('lets a member update only the status of an assigned task', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: 'task-1',
      projectId: 'project-1',
      assigneeId: member.id,
    });
    projectsService.canManageProject.mockResolvedValue(false);
    prisma.task.update.mockResolvedValue({
      id: 'task-1',
      status: TaskStatus.IN_PROGRESS,
    });

    const updated = await service.update(
      'task-1',
      { status: TaskStatus.IN_PROGRESS },
      member,
    );

    expect(updated.status).toBe(TaskStatus.IN_PROGRESS);

    await expect(
      service.update('task-1', { priority: TaskPriority.LOW }, member),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids a member from updating a task that is not assigned to them', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: 'task-1',
      projectId: 'project-1',
      assigneeId: 'someone-else',
    });
    projectsService.canManageProject.mockResolvedValue(false);

    await expect(
      service.update('task-1', { status: TaskStatus.DONE }, member),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
