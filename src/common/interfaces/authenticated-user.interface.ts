import { Role } from '@prisma/client';

/**
 * Shape of the object attached to `request.user` after JWT authentication.
 * Never contains sensitive data such as the password hash.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
