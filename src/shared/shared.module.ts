import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SharedService } from "./shared.service";
import { JwtController } from "./controllers/jwt.controller";
import { SessionController } from "./controllers/session.controller";
import { TokenController } from "./controllers/token.controller";

@Module({
  imports: [AuthModule],
  controllers: [JwtController, SessionController, TokenController],
  providers: [SharedService],
})
export class SharedModule {}
