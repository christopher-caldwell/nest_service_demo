import { Logger, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrdersService } from "../business/orders.service";
import { JwtOrdersController } from "../controllers/jwt/jwt-orders.controller";
import { SessionOrdersController } from "../controllers/session/session-orders.controller";
import { PartnerOrdersController } from "../controllers/partner/partner-orders.controller";

@Module({
  imports: [AuthModule],
  controllers: [
    JwtOrdersController,
    SessionOrdersController,
    PartnerOrdersController,
  ],
  providers: [
    {
      provide: OrdersService,
      useFactory: () => {
        const logger = new Logger(OrdersService.name);
        return new OrdersService((message) => logger.log(message));
      },
    },
  ],
})
export class OrdersModule {}
