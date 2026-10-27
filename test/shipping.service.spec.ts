import { ShippingQuotesService } from "../src/business/shipping/shipping-quotes.service";
import {
  ShippingRate,
  ShippingRateUnavailableError,
} from "../src/business/shipping/shipping-rate.port";
import { CreateShippingQuoteCommand } from "../src/business/shipping/shipping.models";
import { InvalidBusinessInputError } from "../src/business/business-errors";
import { TestShippingRateAdapter } from "../src/providers/shipping/test-shipping-rate.adapter";

describe("Shipping business rules with a local provider", () => {
  let service: ShippingQuotesService;
  let adapter: TestShippingRateAdapter;

  beforeEach(() => {
    // No Nest container or application wiring is needed to test our real logic.
    adapter = new TestShippingRateAdapter();
    service = new ShippingQuotesService(adapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const command = {
    actorId: "unit-test-user",
    destinationCountry: "US" as const,
    weightGrams: 1500,
    orderSubtotalCents: 9999,
  };

  it("adds our handling fee to the provider rate and forwards only provider concerns", async () => {
    const providerCall = jest.spyOn(adapter, "getRate");
    const result = await service.createQuote(command);

    expect(providerCall).toHaveBeenCalledTimes(1);
    expect(providerCall).toHaveBeenCalledWith({
      destinationCountry: "US",
      weightGrams: 1500,
    });
    expect(result.entityOne).toEqual({
      id: expect.any(String),
      createdBy: "unit-test-user",
      carrier: "test-carrier",
      estimatedDays: 3,
      currency: "USD",
      totalCents: 700,
      freeShipping: false,
    });
    expect(result.entityTwos).toEqual([
      { kind: "carrier", amountCents: 500 },
      { kind: "handling", amountCents: 200 },
      { kind: "discount", amountCents: 0 },
    ]);
  });

  it.each([10_000, 10_001])(
    "waives carrier AND handling fees at subtotal %i",
    async (subtotal) => {
      const result = await service.createQuote({
        ...command,
        orderSubtotalCents: subtotal,
      });
      expect(result.entityOne.totalCents).toBe(0);
      expect(result.entityOne.freeShipping).toBe(true);
      expect(result.entityTwos).toEqual([
        { kind: "carrier", amountCents: 500 },
        { kind: "handling", amountCents: 200 },
        { kind: "discount", amountCents: -700 },
      ]);
    },
  );

  it.each([0, 9999, 10_000])(
    "keeps the breakdown consistent for another provider rate at subtotal %i",
    async (subtotal) => {
      const result = await service.createQuote({
        ...command,
        destinationCountry: "CA",
        orderSubtotalCents: subtotal,
      });
      expect(result.entityOne.totalCents).toBe(subtotal >= 10_000 ? 0 : 1200);
      expect(result.entityOne.estimatedDays).toBe(7);
      expect(
        result.entityTwos.reduce((sum, line) => sum + line.amountCents, 0),
      ).toBe(result.entityOne.totalCents);
    },
  );

  it("propagates a provider failure without silently returning a successful quote", async () => {
    const failure = new ShippingRateUnavailableError({
      cause: new Error("Vendor-specific failure"),
    });
    jest.spyOn(adapter, "getRate").mockRejectedValueOnce(failure);
    await expect(service.createQuote(command)).rejects.toBe(failure);
  });

  it.each([
    { actorId: " " },
    { destinationCountry: "ZZ" },
    { weightGrams: 0 },
    { weightGrams: 1.5 },
    { weightGrams: Number.MAX_SAFE_INTEGER + 1 },
    { orderSubtotalCents: -1 },
    { orderSubtotalCents: 0.5 },
    { orderSubtotalCents: Number.MAX_SAFE_INTEGER + 1 },
  ])(
    "rejects invalid business input before calling the provider: %j",
    async (patch) => {
      const providerCall = jest.spyOn(adapter, "getRate");
      await expect(
        service.createQuote({
          ...command,
          ...patch,
        } as CreateShippingQuoteCommand),
      ).rejects.toBeInstanceOf(InvalidBusinessInputError);
      expect(providerCall).not.toHaveBeenCalled();
    },
  );

  it.each([
    { costCents: -1 },
    { costCents: 1.5 },
    { costCents: NaN },
    { costCents: Number.MAX_SAFE_INTEGER },
    { currency: "CAD" },
    { estimatedDays: 0 },
    { carrier: " " },
  ])(
    "rejects a broken provider contract instead of pricing a quote: %j",
    async (patch) => {
      const rate = await adapter.getRate({
        destinationCountry: "US",
        weightGrams: 1500,
      });
      // Model an invalid runtime response despite the compile-time port contract.
      jest
        .spyOn(adapter, "getRate")
        .mockResolvedValueOnce({ ...rate, ...patch } as ShippingRate);
      await expect(service.createQuote(command)).rejects.toBeInstanceOf(
        ShippingRateUnavailableError,
      );
    },
  );
});
