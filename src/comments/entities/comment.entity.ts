import { Prisma } from '@prisma/client';
import { userSelect } from '../../users/entities/user.entity';

export const commentSelect = {
  id: true,
  content: true,
  taskId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: userSelect },
} satisfies Prisma.CommentSelect;

export type CommentEntity = Prisma.CommentGetPayload<{
  select: typeof commentSelect;
}>;
