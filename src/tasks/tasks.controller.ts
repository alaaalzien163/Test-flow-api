import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { Paginated } from '../common/dto/paginated-response.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { TaskEntity } from './entities/task.entity';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a task in a project (ADMIN, MANAGER)' })
  @ApiCreatedResponse({ type: TaskResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskEntity> {
    return this.tasksService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List visible tasks with filtering and pagination',
  })
  @ApiPaginatedResponse(TaskResponseDto)
  findAll(
    @Query() query: QueryTasksDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<TaskEntity>> {
    return this.tasksService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskEntity> {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a task. Members may only change the status of an assigned task.',
  })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskEntity> {
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task (ADMIN, project owner MANAGER)' })
  @ApiNoContentResponse({ description: 'Task deleted' })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.tasksService.remove(id, user);
  }
}
