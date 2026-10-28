import type { Request } from "express";
import type { Actor } from "./actor";

export type AuthenticatedRequest = Request & { actor: Actor };
