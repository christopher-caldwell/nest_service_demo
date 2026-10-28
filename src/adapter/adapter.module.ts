import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FeatureService } from "./feature.service";
import { PROVIDER_PORT, ProviderPort } from "./provider.port";
import { JwtController } from "./controllers/jwt.controller";
import { TokenController } from "./controllers/token.controller";
import { providerBinding } from "./provider.binding";

@Module({
  imports: [AuthModule],
  controllers: [JwtController, TokenController],
  providers: [
    providerBinding, // This is the only place we select a concrete adapter.
    {
      provide: FeatureService,
      inject: [PROVIDER_PORT],
      useFactory: (provider: ProviderPort) => new FeatureService(provider),
    },
  ],
})
export class AdapterModule {}
