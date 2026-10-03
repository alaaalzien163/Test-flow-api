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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { Paginated } from '../common/dto/paginated-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import type { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user (ADMIN only)' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List users with pagination (ADMIN only)' })
  @ApiPaginatedResponse(UserResponseDto)
  findAll(@Query() query: QueryUsersDto): Promise<Paginated<UserEntity>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id (ADMIN only)' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (ADMIN only)' })
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (ADMIN only)' })
  @ApiNoContentResponse({ description: 'User deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
