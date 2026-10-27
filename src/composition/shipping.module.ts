import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ShippingQuotesService } from "../business/shipping/shipping-quotes.service";
import {
  SHIPPING_RATE_PROVIDER,
  ShippingRateProvider,
} from "../business/shipping/shipping-rate.port";
import { CheckoutShippingController } from "../controllers/checkout-shipping/checkout-shipping.controller";
import { PartnerShippingController } from "../controllers/partner-shipping/partner-shipping.controller";
import { shippingProviderBinding } from "./shipping-provider.binding";

@Module({
  imports: [AuthModule],
  controllers: [CheckoutShippingController, PartnerShippingController],
  providers: [
    shippingProviderBinding, // This is the only place we select a concrete adapter.
    {
      provide: ShippingQuotesService,
      inject: [SHIPPING_RATE_PROVIDER],
      useFactory: (provider: ShippingRateProvider) =>
        new ShippingQuotesService(provider),
    },
  ],
})
export class ShippingModule {}
