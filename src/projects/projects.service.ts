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
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectEntity, projectSelect } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateProjectDto,
    user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: user.id,
      },
      select: projectSelect,
    });
  }

  async findAll(
    query: QueryProjectsDto,
    user: AuthenticatedUser,
  ): Promise<Paginated<ProjectEntity>> {
    const where: Prisma.ProjectWhereInput = {
      ...this.visibilityFilter(user),
    };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        select: projectSelect,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  findOne(id: string, user: AuthenticatedUser): Promise<ProjectEntity> {
    return this.assertCanViewProject(id, user);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    await this.assertCanManageProject(id, user);

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      select: projectSelect,
    });
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    await this.assertCanManageProject(id, user);
    await this.prisma.project.delete({ where: { id } });
  }

  /**
   * True when the user may modify the project (ADMIN, or MANAGER that owns it).
   */
  async canManageProject(
    projectId: string,
    user: AuthenticatedUser,
  ): Promise<boolean> {
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.role !== Role.MANAGER) {
      return false;
    }

    const owned = await this.prisma.project.count({
      where: { id: projectId, ownerId: user.id },
    });

    return owned > 0;
  }

  /**
   * Loads a project and ensures the user may read it.
   * ADMIN: any project; others: owned projects or projects with assigned tasks.
   */
  async assertCanViewProject(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: projectSelect,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (user.role === Role.ADMIN || project.ownerId === user.id) {
      return project;
    }

    const assignedTasks = await this.prisma.task.count({
      where: { projectId: id, assigneeId: user.id },
    });

    if (assignedTasks > 0) {
      return project;
    }

    throw new ForbiddenException('You do not have access to this project');
  }

  /**
   * Loads a project and ensures the user may modify/delete it.
   */
  async assertCanManageProject(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    const project = await this.assertCanViewProject(id, user);

    if (user.role === Role.ADMIN) {
      return project;
    }

    if (user.role === Role.MANAGER && project.ownerId === user.id) {
      return project;
    }

    throw new ForbiddenException(
      'You do not have permission to manage this project',
    );
  }

  private visibilityFilter(user: AuthenticatedUser): Prisma.ProjectWhereInput {
    if (user.role === Role.ADMIN) {
      return {};
    }

    return {
      OR: [{ ownerId: user.id }, { tasks: { some: { assigneeId: user.id } } }],
    };
  }
}
