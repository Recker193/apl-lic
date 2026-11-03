import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { hashToken } from '../common/crypto/tokens';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { loadEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(
    req: RequestWithUser,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const env = loadEnv();
    const raw = req.cookies?.[env.cookieName] as string | undefined;
    if (!raw) {
      next();
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      next();
      return;
    }

    if (!session.user.isActive) {
      next();
      return;
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      schoolId: session.user.schoolId,
      isActive: session.user.isActive,
      emailVerifiedAt: session.user.emailVerifiedAt,
    };
    next();
  }
}
