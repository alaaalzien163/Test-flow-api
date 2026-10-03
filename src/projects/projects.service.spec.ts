import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const prisma = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: { count: jest.fn() },
    $transaction: jest.fn(),
  };

  const admin: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };
  const manager: AuthenticatedUser = {
    id: 'manager-1',
    email: 'manager@example.com',
    role: Role.MANAGER,
  };
  const member: AuthenticatedUser = {
    id: 'member-1',
    email: 'member@example.com',
    role: Role.MEMBER,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProjectsService);
  });

  it('creates a project owned by the current user', async () => {
    prisma.project.create.mockResolvedValue({ id: 'project-1' });

    await service.create({ name: 'New project' }, manager);

    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: manager.id }),
      }),
    );
  });

  it('lets an admin manage any project', async () => {
    await expect(service.canManageProject('project-1', admin)).resolves.toBe(
      true,
    );
  });

  it('lets a manager manage a project they own', async () => {
    prisma.project.count.mockResolvedValue(1);

    await expect(service.canManageProject('project-1', manager)).resolves.toBe(
      true,
    );
  });

  it('does not let a member manage a project', async () => {
    await expect(service.canManageProject('project-1', member)).resolves.toBe(
      false,
    );
  });

  it('throws NotFound when the project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(
      service.assertCanViewProject('missing', member),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids a member without assigned tasks from viewing a project', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      ownerId: 'someone-else',
    });
    prisma.task.count.mockResolvedValue(0);

    await expect(
      service.assertCanViewProject('project-1', member),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a member with an assigned task to view the project', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      ownerId: 'someone-else',
    });
    prisma.task.count.mockResolvedValue(1);

    await expect(
      service.assertCanViewProject('project-1', member),
    ).resolves.toMatchObject({ id: 'project-1' });
  });
});
