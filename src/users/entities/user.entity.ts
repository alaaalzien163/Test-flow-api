import { Prisma } from '@prisma/client';

/**
 * Field selection used everywhere a user is returned to a client.
 * Guarantees `passwordHash` is never exposed.
 */
export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserEntity = Prisma.UserGetPayload<{ select: typeof userSelect }>;
