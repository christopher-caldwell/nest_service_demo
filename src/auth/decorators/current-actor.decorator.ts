import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Actor } from "../types/actor";
import type { AuthenticatedRequest } from "../types/authenticated-request";

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().actor,
);
