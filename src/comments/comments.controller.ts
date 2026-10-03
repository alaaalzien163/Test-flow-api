import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { Paginated } from '../common/dto/paginated-response.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import type { CommentEntity } from './entities/comment.entity';

@ApiTags('comments')
@ApiBearerAuth()
@ApiParam({ name: 'taskId', description: 'Task id', format: 'uuid' })
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommentEntity> {
    return this.commentsService.create(taskId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List comments for a task' })
  @ApiPaginatedResponse(CommentResponseDto)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  findAll(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<CommentEntity>> {
    return this.commentsService.findAllByTask(taskId, query, user);
  }
}
