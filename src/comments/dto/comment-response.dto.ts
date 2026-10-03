import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CommentResponseDto {
  @ApiProperty({ example: 'd4e5f6a7-b8c9-4d0e-8123-456789abcdef' })
  id: string;

  @ApiProperty({ example: 'Looks good, just update the copy please.' })
  content: string;

  @ApiProperty({ example: 'c1a2b3c4-d5e6-4f70-8192-a3b4c5d6e7f8' })
  taskId: string;

  @ApiProperty({ example: '6f3c1e0e-2a1f-4b3a-9c1a-2f9a1c2b3d4e' })
  authorId: string;

  @ApiProperty({ type: UserResponseDto })
  author: UserResponseDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
