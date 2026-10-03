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
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectEntity } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a project (ADMIN, MANAGER)' })
  @ApiCreatedResponse({ type: ProjectResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    return this.projectsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List projects visible to the current user' })
  @ApiPaginatedResponse(ProjectResponseDto)
  findAll(
    @Query() query: QueryProjectsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<ProjectEntity>> {
    return this.projectsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiOkResponse({ type: ProjectResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project (owner MANAGER or ADMIN)' })
  @ApiOkResponse({ type: ProjectResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectEntity> {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project (owner MANAGER or ADMIN)' })
  @ApiNoContentResponse({ description: 'Project deleted' })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.projectsService.remove(id, user);
  }
}
