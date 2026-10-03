import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: '6f3c1e0e-2a1f-4b3a-9c1a-2f9a1c2b3d4e' })
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.MEMBER })
  role: Role;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
