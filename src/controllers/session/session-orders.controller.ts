import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Actor, CurrentActor } from "../../auth/current-actor";
import { SessionAuthGuard } from "../../auth/session-auth.guard";
import { OrdersService } from "../../business/orders.service";
import {
  SessionCreateOrderDto,
  SessionOrderResponseDto,
} from "./session-order.dto";

@Controller("session/orders")
@UseGuards(SessionAuthGuard)
export class SessionOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body() dto: SessionCreateOrderDto,
    @CurrentActor() actor: Actor,
  ): SessionOrderResponseDto {
    const result = this.orders.createOrder({
      actorId: actor.id,
      customerName: dto.buyerName,
      items: dto.basket.map((item) => ({
        sku: item.productCode,
        quantity: item.units,
      })),
    });

    // A flat confirmation and renamed fields for a session-based client.
    return {
      confirmation: result.entityOne.id,
      buyer: result.entityOne.customerName,
      accepted: result.entityOne.status === "accepted",
      totalUnits: result.entityOne.totalQuantity,
      basket: result.entityTwos.map((line) => ({
        lineReference: line.id,
        productCode: line.sku,
        units: line.quantity,
      })),
    };
  }
}
