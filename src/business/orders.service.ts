import { randomUUID } from "node:crypto";
import { InvalidBusinessInputError } from "./business-errors";
import { CreateOrderCommand, CreateOrderResult } from "./order.models";

export class OrdersService {
  constructor(private readonly log: (message: string) => void = console.log) {}

  createOrder(command: CreateOrderCommand): CreateOrderResult {
    if (!command.actorId.trim() || !command.customerName.trim()) {
      throw new InvalidBusinessInputError(
        "An actor and customer name are required",
      );
    }
    if (
      command.items.length === 0 ||
      command.items.some(
        (item) =>
          !item.sku.trim() ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      throw new InvalidBusinessInputError(
        "Order lines require a product code and positive safe integer quantity",
      );
    }
    const totalQuantity = command.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    if (!Number.isSafeInteger(totalQuantity)) {
      throw new InvalidBusinessInputError(
        "Total quantity exceeds the supported range",
      );
    }
    const orderId = randomUUID();
    // A real implementation could persist the order and its lines here.
    this.log(`Creating order: ${JSON.stringify(command)}`);

    return {
      entityOne: {
        id: orderId,
        customerName: command.customerName,
        createdBy: command.actorId,
        status: "accepted",
        totalQuantity,
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
