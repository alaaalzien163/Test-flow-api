import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class TaskProjectSummaryDto {
  @ApiProperty({ example: 'b3b8f1e2-3c4d-4e5f-8a9b-0c1d2e3f4a5b' })
  id: string;

  @ApiProperty({ example: 'Website Redesign' })
  name: string;
}

export class TaskResponseDto {
  @ApiProperty({ example: 'c1a2b3c4-d5e6-4f70-8192-a3b4c5d6e7f8' })
  id: string;

  @ApiProperty({ example: 'Design landing page' })
  title: string;

  @ApiPropertyOptional({ example: 'Create the hero section', nullable: true })
  description: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ApiProperty({ example: 'b3b8f1e2-3c4d-4e5f-8a9b-0c1d2e3f4a5b' })
  projectId: string;

  @ApiPropertyOptional({
    example: '6f3c1e0e-2a1f-4b3a-9c1a-2f9a1c2b3d4e',
    nullable: true,
  })
  assigneeId: string | null;

  @ApiPropertyOptional({ type: UserResponseDto, nullable: true })
  assignee: UserResponseDto | null;

  @ApiProperty({ type: TaskProjectSummaryDto })
  project: TaskProjectSummaryDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
