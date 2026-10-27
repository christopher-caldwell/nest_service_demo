import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export interface Actor {
  id: string;
}

export type AuthenticatedRequest = Request & { actor: Actor };

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().actor,
);
