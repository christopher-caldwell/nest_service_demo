import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthenticatedRequest } from "./current-actor";
import { SessionCacheService } from "./session-cache.service";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionCacheService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = request.header("x-session-id");
    const actor = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!actor) throw new UnauthorizedException("Unknown or expired session");
    request.actor = actor;
    return true;
  }
}
