import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthenticatedRequest } from "./current-actor";
import { demoConfig } from "./demo-config";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer ([^\s]+)$/i.exec(
      request.headers.authorization ?? "",
    );
    if (!match) throw new UnauthorizedException("A Bearer JWT is required");

    try {
      const claims = await this.jwt.verifyAsync<{
        sub?: unknown;
        exp?: unknown;
      }>(match[1], {
        algorithms: ["HS256"],
        issuer: demoConfig.jwtIssuer,
        audience: demoConfig.jwtAudience,
      });
      if (
        typeof claims.sub !== "string" ||
        claims.sub.trim().length === 0 ||
        typeof claims.exp !== "number"
      ) {
        throw new Error("JWT must contain a subject and expiration");
      }
      request.actor = { id: claims.sub };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired JWT");
    }
  }
}
