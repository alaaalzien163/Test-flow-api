import { Prisma } from '@prisma/client';
import { userSelect } from '../../users/entities/user.entity';

export const projectSelect = {
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: userSelect },
} satisfies Prisma.ProjectSelect;

export type ProjectEntity = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}>;
