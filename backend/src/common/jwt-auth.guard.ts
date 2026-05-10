import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthUser } from './types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: AuthUser }>();
    const header = request.headers.authorization ?? request.headers.Authorization;
    try {
      // Log helpful debug info (do not print full token in prod)
      // eslint-disable-next-line no-console
      console.log('[JwtAuthGuard] Authorization header present:', !!header, 'type:', typeof header);
      if (typeof header === 'string') {
        // show only first/last chars and length to avoid leaking sensitive data in logs
        // eslint-disable-next-line no-console
        console.log('[JwtAuthGuard] Authorization header sample:', `${header.slice(0,8)}...${header.slice(-8)}`, 'len=', header.length);
      }
    } catch (e) {
      // ignore logging errors
    }
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthUser>(token);
      return true;
    } catch {
      // Log verification failure for debugging
      // eslint-disable-next-line no-console
      console.error('[JwtAuthGuard] Token verification failed for token sample:', typeof token === 'string' ? `${String(token).slice(0,8)}...` : token);
      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}
