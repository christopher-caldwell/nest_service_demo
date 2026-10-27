import { ClassProvider } from "@nestjs/common";
import { LiveShippingRateAdapter } from "../providers/shipping/live-shipping-rate.adapter";
import { TestShippingRateAdapter } from "../providers/shipping/test-shipping-rate.adapter";
import {
  SHIPPING_RATE_PROVIDER,
  ShippingRateProvider,
} from "../business/shipping/shipping-rate.port";

// ADAPTER SWITCH: keep exactly ONE useClass line uncommented, then restart/rebuild.
// Both controllers use the same service; this binding changes only its provider.
export const shippingProviderBinding: ClassProvider<ShippingRateProvider> = {
  provide: SHIPPING_RATE_PROVIDER,

  useClass: TestShippingRateAdapter, // ACTIVE: deterministic local fixtures, zero provider cost.
  // useClass: LiveShippingRateAdapter, // Uncomment this and comment the line above for simulated live mode.
};

// Tests explicitly override this token with TestShippingRateAdapter, so changing
// the application binding to live cannot accidentally make tests use a paid provider.
