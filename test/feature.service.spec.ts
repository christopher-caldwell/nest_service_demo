import { FeatureService } from "../src/business/group-2/feature.service";
import { ProviderError } from "../src/business/group-2/provider.port";
import { InvalidBusinessInputError } from "../src/business/business-errors";
import { TestAdapter } from "../src/providers/test.adapter";

describe("FeatureService with TestAdapter", () => {
  let service: FeatureService;
  let adapter: TestAdapter;
  const command = { actorId: "demo-user", value: 5 };

  beforeEach(() => {
    // Real business logic, directly constructed. No Nest container or external provider.
    adapter = new TestAdapter();
    service = new FeatureService(adapter);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([0, 5, 10])(
    "adds the local value to the provider result for input %i",
    async (value) => {
      const call = jest.spyOn(adapter, "fetchValue");
      const result = await service.execute({ ...command, value });
      expect(call).toHaveBeenCalledTimes(1);
      expect(call).toHaveBeenCalledWith({ value }); // Auth identity stays out of the provider contract.
      expect(result.entityOne).toEqual({
        id: expect.any(String),
        createdBy: "demo-user",
        total: value * 2 + 10,
      });
      expect(result.entityTwos).toEqual([
        { name: "provider", value: value * 2 },
        { name: "local", value: 10 },
      ]);
      expect(result.entityTwos.reduce((sum, item) => sum + item.value, 0)).toBe(
        result.entityOne.total,
      );
    },
  );

  it("uses the supplied provider output instead of duplicating the adapter's calculation", async () => {
    jest.spyOn(adapter, "fetchValue").mockResolvedValueOnce({ value: 123 });
    expect((await service.execute(command)).entityOne.total).toBe(133);
  });

  it.each([
    { actorId: " " },
    { value: -1 },
    { value: 1.5 },
    { value: Number.MAX_SAFE_INTEGER + 1 },
  ])(
    "rejects invalid commands before contacting the provider: %j",
    async (patch) => {
      const call = jest.spyOn(adapter, "fetchValue");
      await expect(
        service.execute({ ...command, ...patch }),
      ).rejects.toBeInstanceOf(InvalidBusinessInputError);
      expect(call).not.toHaveBeenCalled();
    },
  );

  it.each([-1, 1.5, NaN, Number.MAX_SAFE_INTEGER])(
    "rejects an invalid provider value: %s",
    async (value) => {
      jest.spyOn(adapter, "fetchValue").mockResolvedValueOnce({ value });
      await expect(service.execute(command)).rejects.toBeInstanceOf(
        ProviderError,
      );
    },
  );

  it("propagates the port's error without returning a successful result", async () => {
    const error = new ProviderError({
      cause: new Error("Provider-specific failure"),
    });
    jest.spyOn(adapter, "fetchValue").mockRejectedValueOnce(error);
    await expect(service.execute(command)).rejects.toBe(error);
  });
});
