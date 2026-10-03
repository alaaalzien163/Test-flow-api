import { Prisma } from '@prisma/client';
import { userSelect } from '../../users/entities/user.entity';

export const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: userSelect },
  project: { select: { id: true, name: true } },
} satisfies Prisma.TaskSelect;

export type TaskEntity = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
