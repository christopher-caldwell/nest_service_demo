import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../types/authenticated-request";
import { demoConfig } from "../demo-config";

@Injectable()
export class StaticTokenAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.header("x-api-token") !== demoConfig.staticToken) {
      throw new UnauthorizedException();
    }
    request.actor = { id: demoConfig.actorId };
    return true;
  }
}
