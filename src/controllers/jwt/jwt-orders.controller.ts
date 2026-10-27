import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Actor, CurrentActor } from "../../auth/current-actor";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { OrdersService } from "../../business/orders.service";
import { JwtCreateOrderDto, JwtOrderResponseDto } from "./jwt-order.dto";

@Controller("jwt/orders")
@UseGuards(JwtAuthGuard)
export class JwtOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @Body() dto: JwtCreateOrderDto,
    @CurrentActor() actor: Actor,
  ): JwtOrderResponseDto {
    // Translate this API's input contract into the shared business command.
    const result = this.orders.createOrder({
      actorId: actor.id,
      customerName: dto.customerName,
      items: dto.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
    });

    // Compose both business entities into this API's nested response contract.
    return {
      order: {
        id: result.entityOne.id,
        customerName: result.entityOne.customerName,
        status: result.entityOne.status,
        totalQuantity: result.entityOne.totalQuantity,
        items: result.entityTwos.map((line) => ({
          id: line.id,
          sku: line.sku,
          quantity: line.quantity,
        })),
      },
    };
  }
}
