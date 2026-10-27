import { OrdersService } from "../src/business/orders.service";
import { InvalidBusinessInputError } from "../src/business/business-errors";

describe("Order business rules without HTTP or Nest", () => {
  const command = {
    actorId: "worker-user",
    customerName: "Ada",
    items: [
      { sku: "BOOK", quantity: 2 },
      { sku: "PEN", quantity: 3 },
    ],
  };

  it("creates linked entities and calculates the total for a non-HTTP caller", () => {
    const service = new OrdersService(() => {});
    const result = service.createOrder(command);
    expect(result.entityOne).toEqual({
      id: expect.any(String),
      customerName: "Ada",
      createdBy: "worker-user",
      status: "accepted",
      totalQuantity: 5,
    });
    expect(result.entityTwos).toEqual([
      {
        id: expect.any(String),
        orderId: result.entityOne.id,
        sku: "BOOK",
        quantity: 2,
      },
      {
        id: expect.any(String),
        orderId: result.entityOne.id,
        sku: "PEN",
        quantity: 3,
      },
    ]);
  });

  it.each([
    { actorId: " " },
    { customerName: " " },
    { items: [] },
    { items: [{ sku: " ", quantity: 2 }] },
    { items: [{ sku: "BOOK", quantity: 0 }] },
    { items: [{ sku: "BOOK", quantity: 1.5 }] },
    {
      items: [
        { sku: "BOOK", quantity: Number.MAX_SAFE_INTEGER },
        { sku: "PEN", quantity: 1 },
      ],
    },
  ])("protects business invariants for every caller: %j", (patch) => {
    const log = jest.fn();
    const service = new OrdersService(log);
    expect(() => service.createOrder({ ...command, ...patch })).toThrow(
      InvalidBusinessInputError,
    );
    expect(log).not.toHaveBeenCalled();
  });
});
