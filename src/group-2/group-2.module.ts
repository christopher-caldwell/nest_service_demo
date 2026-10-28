import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FeatureService } from "./feature.service";
import { PROVIDER_PORT, ProviderPort } from "./provider.port";
import { Group2Controller1 } from "./group-2-controller-1.controller";
import { Group2Controller2 } from "./group-2-controller-2.controller";
import { providerBinding } from "./provider.binding";

@Module({
  imports: [AuthModule],
  controllers: [Group2Controller1, Group2Controller2],
  providers: [
    providerBinding, // This is the only place we select a concrete adapter.
    {
      provide: FeatureService,
      inject: [PROVIDER_PORT],
      useFactory: (provider: ProviderPort) => new FeatureService(provider),
    },
  ],
})
export class Group2Module {}
