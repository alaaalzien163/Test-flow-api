import { Injectable } from '@nestjs/common';
import {
  Paginated,
  buildPaginationMeta,
} from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentEntity, commentSelect } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async create(
    taskId: string,
    dto: CreateCommentDto,
    user: AuthenticatedUser,
  ): Promise<CommentEntity> {
    await this.tasksService.findOne(taskId, user);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId,
        authorId: user.id,
      },
      select: commentSelect,
    });
  }

  async findAllByTask(
    taskId: string,
    query: PaginationQueryDto,
    user: AuthenticatedUser,
  ): Promise<Paginated<CommentEntity>> {
    await this.tasksService.findOne(taskId, user);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { taskId },
        select: commentSelect,
        orderBy: { createdAt: 'asc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.comment.count({ where: { taskId } }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }
}
