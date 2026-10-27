import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { ShippingQuotesService } from "../src/shipping/shipping-quotes.service";
import { SHIPPING_RATE_PROVIDER } from "../src/shipping/shipping-rate.port";
import { TestShippingRateAdapter } from "../src/shipping/adapters/test-shipping-rate.adapter";

describe("Shipping business rules with a local provider", () => {
  let module: TestingModule;
  let service: ShippingQuotesService;
  let adapter: TestShippingRateAdapter;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ShippingQuotesService, // The REAL service is what we want to test.
        { provide: SHIPPING_RATE_PROVIDER, useClass: TestShippingRateAdapter },
      ],
    }).compile();
    service = module.get(ShippingQuotesService);
    adapter = module.get(SHIPPING_RATE_PROVIDER);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
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
    jest
      .spyOn(adapter, "getRate")
      .mockRejectedValueOnce(new Error("Provider unavailable"));
    await expect(service.createQuote(command)).rejects.toThrow(
      "Provider unavailable",
    );
  });
});
