import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Actor, CurrentActor } from "../../auth/current-actor";
import { StaticTokenAuthGuard } from "../../auth/static-token-auth.guard";
import { OrdersService } from "../../business/orders.service";
import {
  PartnerCreateOrderDto,
  PartnerOrderResponseDto,
} from "./partner-order.dto";

@Controller("partner/orders")
@UseGuards(StaticTokenAuthGuard)
export class PartnerOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body() dto: PartnerCreateOrderDto,
    @CurrentActor() actor: Actor,
  ): PartnerOrderResponseDto {
    const result = this.orders.createOrder({
      actorId: actor.id,
      customerName: dto.customer_name,
      items: dto.lines.map((line) => ({
        sku: line.product_code,
        quantity: line.count,
      })),
    });

    // The partner's snake_case contract is confined to this controller.
    return {
      order_ref: result.entityOne.id,
      customer_name: result.entityOne.customerName,
      state: result.entityOne.status.toUpperCase(),
      total_units: result.entityOne.totalQuantity,
      line_items: result.entityTwos.map((line) => ({
        line_ref: line.id,
        product_code: line.sku,
        count: line.quantity,
      })),
    };
  }
}
