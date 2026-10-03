import { Role } from '@prisma/client';

/**
 * Payload embedded in the JWT access token.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
