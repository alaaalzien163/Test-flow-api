import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { hashPassword } from '../common/utils/password.util';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const publicUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: Role.MEMBER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('hashes nothing itself, delegates creation and returns a token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(publicUser);
      jwtService.signAsync.mockResolvedValue('signed-token');

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          role: Role.MEMBER,
        }),
      );
      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toEqual(publicUser);
    });

    it('rejects registration when the email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const passwordHash = await hashPassword('password123');
      usersService.findByEmail.mockResolvedValue({
        ...publicUser,
        passwordHash,
      });
      jwtService.signAsync.mockResolvedValue('signed-token');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(Object.keys(result.user)).not.toContain('passwordHash');
    });

    it('rejects an invalid password', async () => {
      const passwordHash = await hashPassword('password123');
      usersService.findByEmail.mockResolvedValue({
        ...publicUser,
        passwordHash,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'missing@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
