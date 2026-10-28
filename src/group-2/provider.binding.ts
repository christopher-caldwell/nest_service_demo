import { ClassProvider } from "@nestjs/common";
import { PROVIDER_PORT, ProviderPort } from "./provider.port";
import { ProviderAdapter } from "./adapters/provider.adapter";
import { TestAdapter } from "./adapters/test.adapter";

// SWITCH HERE: leave exactly ONE useClass line uncommented, then rebuild/restart.
export const providerBinding: ClassProvider<ProviderPort> = {
  provide: PROVIDER_PORT,

  useClass: TestAdapter, // TEST: local and deterministic, no provider cost.
  // useClass: ProviderAdapter, // LIVE: simulated external call in this demo.
};

// Tests override this token with TestAdapter regardless of the application selection.
