import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthenticatedRequest } from "../types/authenticated-request";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (request.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) throw new UnauthorizedException();

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      request.actor = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
