import { Injectable } from "@nestjs/common";
import { Actor } from "./current-actor";
import { demoConfig } from "./demo-config";

interface CachedSession {
  actor: Actor;
  expiresAt: number;
}

@Injectable()
export class SessionCacheService {
  private readonly sessions = new Map<string, CachedSession>();

  constructor() {
    // A known session keeps the demo runnable without a fourth controller.
    this.set(demoConfig.sessionId, { id: demoConfig.actorId }, 60 * 60 * 1000);
  }

  set(sessionId: string, actor: Actor, ttlMs: number): void {
    this.sessions.set(sessionId, {
      actor: { ...actor },
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(sessionId: string): Actor | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return { ...session.actor };
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
