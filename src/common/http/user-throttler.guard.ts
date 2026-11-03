import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Limitare pe utilizator autentificat, cu revenire la IP pentru cereri anonime
 * (login, forgot-password etc.).
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { id?: string } | undefined;
    const ip = typeof req.ip === 'string' ? req.ip : 'unknown';
    return Promise.resolve(user?.id ? `user:${user.id}` : `ip:${ip}`);
  }
}
