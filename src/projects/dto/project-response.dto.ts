import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ProjectResponseDto {
  @ApiProperty({ example: 'b3b8f1e2-3c4d-4e5f-8a9b-0c1d2e3f4a5b' })
  id: string;

  @ApiProperty({ example: 'Website Redesign' })
  name: string;

  @ApiPropertyOptional({
    example: 'Revamp the marketing website',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '6f3c1e0e-2a1f-4b3a-9c1a-2f9a1c2b3d4e' })
  ownerId: string;

  @ApiProperty({ type: UserResponseDto })
  owner: UserResponseDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
