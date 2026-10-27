import { Module } from "@nestjs/common";
import { OrdersModule } from "./composition/orders.module";
import { ShippingModule } from "./composition/shipping.module";

@Module({ imports: [OrdersModule, ShippingModule] })
export class AppModule {}
