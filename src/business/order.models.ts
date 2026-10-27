// Business types contain no HTTP, auth, or controller DTO dependencies.
export interface CreateOrderCommand {
  actorId: string;
  customerName: string;
  items: { sku: string; quantity: number }[];
}

export interface Order {
  id: string;
  customerName: string;
  createdBy: string;
  status: "accepted";
  totalQuantity: number;
}

export interface OrderLine {
  id: string;
  orderId: string;
  sku: string;
  quantity: number;
}

export interface CreateOrderResult {
  entityOne: Order;
  entityTwos: OrderLine[];
}
