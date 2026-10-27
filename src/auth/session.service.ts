import { Injectable } from "@nestjs/common";
import type { Actor } from "./actor";

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, Actor>();

  set(sessionId: string, actor: Actor): void {
    this.sessions.set(sessionId, actor);
  }

  get(sessionId: string): Actor | undefined {
    return this.sessions.get(sessionId);
  }
}
