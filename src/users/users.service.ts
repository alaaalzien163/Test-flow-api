import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import {
  Paginated,
  buildPaginationMeta,
} from '../common/dto/paginated-response.dto';
import { hashPassword } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity, userSelect } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        role: dto.role ?? Role.MEMBER,
      },
      select: userSelect,
    });
  }

  async findAll(query: QueryUsersDto): Promise<Paginated<UserEntity>> {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Returns the full record (including the password hash) for authentication.
   * Must not be exposed directly by controllers.
   */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    await this.findOne(id);

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already registered');
      }
      data.email = email;
    }

    if (dto.password !== undefined) {
      data.passwordHash = await hashPassword(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
