import { UserRole } from '@prisma/client';

export class AuthenticatedUser {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
  schoolId!: string;
  isActive!: boolean;
  emailVerifiedAt!: Date | null;
}
