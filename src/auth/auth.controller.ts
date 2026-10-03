import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import type { UserEntity } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already registered',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and obtain a JWT access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid credentials',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Missing or invalid access token',
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserEntity> {
    return this.authService.getProfile(user);
  }
}
