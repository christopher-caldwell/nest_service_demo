import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { demoConfig } from "./auth/demo-config";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { SessionAuthGuard } from "./auth/session-auth.guard";
import { SessionCacheService } from "./auth/session-cache.service";
import { StaticTokenAuthGuard } from "./auth/static-token-auth.guard";
import { OrdersService } from "./business/orders.service";
import { JwtOrdersController } from "./controllers/jwt/jwt-orders.controller";
import { SessionOrdersController } from "./controllers/session/session-orders.controller";
import { PartnerOrdersController } from "./controllers/partner/partner-orders.controller";
import { CheckoutShippingController } from "./controllers/checkout-shipping/checkout-shipping.controller";
import { PartnerShippingController } from "./controllers/partner-shipping/partner-shipping.controller";
import { ShippingQuotesService } from "./shipping/shipping-quotes.service";
import { shippingProviderBinding } from "./shipping/shipping-provider.binding";

@Module({
  imports: [JwtModule.register({ secret: demoConfig.jwtSecret })],
  controllers: [
    JwtOrdersController,
    SessionOrdersController,
    PartnerOrdersController,
    CheckoutShippingController,
    PartnerShippingController,
  ],
  providers: [
    OrdersService,
    ShippingQuotesService,
    shippingProviderBinding,
    SessionCacheService,
    JwtAuthGuard,
    SessionAuthGuard,
    StaticTokenAuthGuard,
  ],
})
export class AppModule {}
