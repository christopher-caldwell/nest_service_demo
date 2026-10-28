import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../types/authenticated-request";
import { SessionService } from "../session.service";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = request.header("x-session-id");
    const actor = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!actor) throw new UnauthorizedException("Unknown session");
    request.actor = actor;
    return true;
  }
}
