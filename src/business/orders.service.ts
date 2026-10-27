import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { CreateOrderCommand, CreateOrderResult } from "./order.models";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  createOrder(command: CreateOrderCommand): CreateOrderResult {
    const orderId = randomUUID();
    // A real implementation could persist the order and its lines here.
    this.logger.log(`Creating order: ${JSON.stringify(command)}`);

    return {
      entityOne: {
        id: orderId,
        customerName: command.customerName,
        createdBy: command.actorId,
        status: "accepted",
        totalQuantity: command.items.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
      },
      entityTwos: command.items.map((item) => ({
        id: randomUUID(),
        orderId,
        sku: item.sku,
        quantity: item.quantity,
      })),
    };
  }
}
