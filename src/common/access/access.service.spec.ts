import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AccessService } from './access.service';
import { AuthenticatedUser } from '../types/authenticated-user';

describe('AccessService', () => {
  const service = new AccessService({} as never);
  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'a@example.com',
    firstName: 'A',
    lastName: 'B',
    role: UserRole.STUDENT,
    schoolId: 'school-a',
    isActive: true,
    emailVerifiedAt: new Date(),
  };

  it('allows the same school', () => {
    expect(() => service.assertSameSchool(user, 'school-a')).not.toThrow();
  });

  it('hides other schools as not found', () => {
    expect(() => service.assertSameSchool(user, 'school-b')).toThrow(
      NotFoundException,
    );
  });
});
