import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design landing page', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Create the hero section and call to action',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ example: 'b3b8f1e2-3c4d-4e5f-8a9b-0c1d2e3f4a5b' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: '6f3c1e0e-2a1f-4b3a-9c1a-2f9a1c2b3d4e' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
