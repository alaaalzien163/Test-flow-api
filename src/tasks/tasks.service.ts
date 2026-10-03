import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import {
  Paginated,
  buildPaginationMeta,
} from '../common/dto/paginated-response.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity, taskSelect } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    dto: CreateTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskEntity> {
    const canManage = await this.projectsService.canManageProject(
      dto.projectId,
      user,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to add tasks to this project',
      );
    }

    if (dto.assigneeId) {
      await this.usersService.findOne(dto.assigneeId);
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        projectId: dto.projectId,
        assigneeId: dto.assigneeId,
      },
      select: taskSelect,
    });
  }

  async findAll(
    query: QueryTasksDto,
    user: AuthenticatedUser,
  ): Promise<Paginated<TaskEntity>> {
    const where: Prisma.TaskWhereInput = { ...this.visibilityFilter(user) };

    if (query.projectId) {
      where.projectId = query.projectId;
    }
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        select: taskSelect,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  /**
   * Loads a task the user is allowed to see, or throws 404/403.
   * Reused by the comments module.
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<TaskEntity> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: taskSelect,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertCanViewTask(task, user);

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: taskSelect,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const canManage = await this.projectsService.canManageProject(
      task.projectId,
      user,
    );

    if (!canManage) {
      if (task.assigneeId !== user.id) {
        throw new ForbiddenException(
          'You do not have permission to update this task',
        );
      }

      const providedFields = Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => key);

      if (providedFields.some((field) => field !== 'status')) {
        throw new ForbiddenException('Members may only update the task status');
      }
    }

    const data: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.projectId !== undefined && dto.projectId !== task.projectId) {
      const canManageTarget = await this.projectsService.canManageProject(
        dto.projectId,
        user,
      );
      if (!canManageTarget) {
        throw new ForbiddenException(
          'You do not have permission to move this task to that project',
        );
      }
      data.project = { connect: { id: dto.projectId } };
    }

    if (dto.assigneeId !== undefined) {
      await this.usersService.findOne(dto.assigneeId);
      data.assignee = { connect: { id: dto.assigneeId } };
    }

    return this.prisma.task.update({
      where: { id },
      data,
      select: taskSelect,
    });
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const canManage = await this.projectsService.canManageProject(
      task.projectId,
      user,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    await this.prisma.task.delete({ where: { id } });
  }

  private async assertCanViewTask(
    task: TaskEntity,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (task.assigneeId === user.id) {
      return;
    }

    if (user.role === Role.MANAGER) {
      const owns = await this.projectsService.canManageProject(
        task.projectId,
        user,
      );
      if (owns) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to this task');
  }

  private visibilityFilter(user: AuthenticatedUser): Prisma.TaskWhereInput {
    if (user.role === Role.ADMIN) {
      return {};
    }

    if (user.role === Role.MANAGER) {
      return {
        OR: [{ project: { ownerId: user.id } }, { assigneeId: user.id }],
      };
    }

    return { assigneeId: user.id };
  }
}
