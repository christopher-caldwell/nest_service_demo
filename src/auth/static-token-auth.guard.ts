import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { AuthenticatedRequest } from "./current-actor";
import { demoConfig } from "./demo-config";

@Injectable()
export class StaticTokenAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const supplied = Buffer.from(request.header("x-api-token") ?? "");
    const expected = Buffer.from(demoConfig.staticToken);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      throw new UnauthorizedException("Invalid static API token");
    }
    request.actor = { id: demoConfig.actorId };
    return true;
  }
}
