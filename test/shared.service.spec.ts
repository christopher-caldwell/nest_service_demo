import { SharedService } from "../src/business/group-1/shared.service";
import { InvalidBusinessInputError } from "../src/business/business-errors";

describe("EntityOne business rules without HTTP or Nest", () => {
  const command = {
    actorId: "worker-user",
    name: "demo",
    items: [
      { code: "A", value: 2 },
      { code: "B", value: 3 },
    ],
  };

  it("creates linked entities and calculates the total for a non-HTTP caller", () => {
    const service = new SharedService(() => {});
    const result = service.execute(command);
    expect(result.entityOne).toEqual({
      id: expect.any(String),
      name: "demo",
      createdBy: "worker-user",
      status: "accepted",
      total: 5,
    });
    expect(result.entityTwos).toEqual([
      {
        id: expect.any(String),
        entityOneId: result.entityOne.id,
        code: "A",
        value: 2,
      },
      {
        id: expect.any(String),
        entityOneId: result.entityOne.id,
        code: "B",
        value: 3,
      },
    ]);
  });

  it.each([
    { actorId: " " },
    { name: " " },
    { items: [] },
    { items: [{ code: " ", value: 2 }] },
    { items: [{ code: "A", value: 0 }] },
    { items: [{ code: "A", value: 1.5 }] },
    {
      items: [
        { code: "A", value: Number.MAX_SAFE_INTEGER },
        { code: "B", value: 1 },
      ],
    },
  ])("protects business invariants for every caller: %j", (patch) => {
    const log = jest.fn();
    const service = new SharedService(log);
    expect(() => service.execute({ ...command, ...patch })).toThrow(
      InvalidBusinessInputError,
    );
    expect(log).not.toHaveBeenCalled();
  });
});
