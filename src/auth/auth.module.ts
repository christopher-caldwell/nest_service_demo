import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { demoConfig } from "./demo-config";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import { SessionService } from "./session.service";
import { StaticTokenAuthGuard } from "./static-token-auth.guard";

@Module({
  imports: [JwtModule.register({ secret: demoConfig.jwtSecret })],
  providers: [
    JwtAuthGuard,
    SessionAuthGuard,
    StaticTokenAuthGuard,
    {
      provide: SessionService,
      useFactory: () => {
        const sessions = new SessionService();
        // Demo provisioning belongs to startup wiring, not the cache implementation.
        sessions.set(
          demoConfig.sessionId,
          { id: demoConfig.actorId },
          60 * 60 * 1000,
        );
        return sessions;
      },
    },
  ],
  exports: [
    JwtModule,
    SessionService,
    JwtAuthGuard,
    SessionAuthGuard,
    StaticTokenAuthGuard,
  ],
})
export class AuthModule {}
