import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { demoConfig } from "../src/auth/demo-config";
import { ShippingQuotesService } from "../src/business/shipping/shipping-quotes.service";
import {
  SHIPPING_RATE_PROVIDER,
  ShippingRateUnavailableError,
} from "../src/business/shipping/shipping-rate.port";
import { TestShippingRateAdapter } from "../src/providers/shipping/test-shipping-rate.adapter";
import { LiveShippingRateAdapter } from "../src/providers/shipping/live-shipping-rate.adapter";

describe("Two shipping controllers → real service → local provider", () => {
  let app: INestApplication;
  let service: ShippingQuotesService;
  let token: string;

  const checkoutBody = {
    destinationCountry: "US",
    weightGrams: 1500,
    orderSubtotalCents: 5000,
  };
  const partnerBody = {
    destination_country: "US",
    package_weight_grams: 1500,
    order_value_cents: 5000,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      // Override the PORT, never the business service. Tests stay local even if
      // someone switches the application's commented binding to the live adapter.
      .overrideProvider(SHIPPING_RATE_PROVIDER)
      .useClass(TestShippingRateAdapter)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    service = app.get(ShippingQuotesService);
    token = app.get(JwtService).sign(
      { sub: demoConfig.actorId },
      {
        algorithm: "HS256",
        issuer: demoConfig.jwtIssuer,
        audience: demoConfig.jwtAudience,
        expiresIn: 3600,
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  afterAll(async () => {
    await app?.close();
  });

  function clients() {
    return [
      {
        path: "/checkout/shipping-quotes",
        header: "Authorization",
        credential: `Bearer ${token}`,
        body: checkoutBody,
      },
      {
        path: "/partner/shipping-quotes",
        header: "X-Api-Token",
        credential: demoConfig.staticToken,
        body: partnerBody,
      },
    ];
  }

  it("fails before constructing live provider code if a test forgets its local override", async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          {
            provide: SHIPPING_RATE_PROVIDER,
            useClass: LiveShippingRateAdapter,
          },
        ],
      }).compile(),
    ).rejects.toThrow("Live provider construction is forbidden in tests");
  });

  it("runs both DTO mappings through the same real business rules without calling live", async () => {
    expect(app.get(SHIPPING_RATE_PROVIDER)).toBeInstanceOf(
      TestShippingRateAdapter,
    );
    const serviceCall = jest.spyOn(service, "createQuote"); // Calls through; no mocked business result.
    const responses = [];
    for (const client of clients()) {
      const response = await request(app.getHttpServer())
        .post(client.path)
        .set(client.header, client.credential)
        .send(client.body)
        .expect(201);
      responses.push(response.body);
    }

    expect(serviceCall).toHaveBeenCalledTimes(2);
    for (const [command] of serviceCall.mock.calls) {
      expect(command).toEqual({
        actorId: demoConfig.actorId,
        destinationCountry: "US",
        weightGrams: 1500,
        orderSubtotalCents: 5000,
      });
    }
    expect(LiveShippingRateAdapter).not.toHaveBeenCalled();
    expect(responses[0]).toEqual({
      quote: {
        id: expect.any(String),
        carrier: "test-carrier",
        estimatedDays: 3,
        currency: "USD",
        totalCents: 700,
        freeShipping: false,
        breakdown: [
          { label: "carrier", amountCents: 500 },
          { label: "handling", amountCents: 200 },
          { label: "discount", amountCents: 0 },
        ],
      },
    });
    expect(responses[1]).toEqual({
      quote_ref: expect.any(String),
      carrier_name: "test-carrier",
      delivery_days: 3,
      currency_code: "USD",
      shipping_charge_cents: 700,
      shipping_waived: false,
      charge_lines: [
        { code: "CARRIER", value_cents: 500 },
        { code: "HANDLING", value_cents: 200 },
        { code: "DISCOUNT", value_cents: 0 },
      ],
    });
  });

  it("exposes the shared free-shipping rule in both response contracts", async () => {
    const checkout = await request(app.getHttpServer())
      .post("/checkout/shipping-quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...checkoutBody, orderSubtotalCents: 10000 })
      .expect(201);
    expect(checkout.body.quote.totalCents).toBe(0);
    expect(checkout.body.quote.freeShipping).toBe(true);
    expect(checkout.body.quote.breakdown[2].amountCents).toBe(-700);

    const partner = await request(app.getHttpServer())
      .post("/partner/shipping-quotes")
      .set("X-Api-Token", demoConfig.staticToken)
      .send({ ...partnerBody, order_value_cents: 10000 })
      .expect(201);
    expect(partner.body.shipping_charge_cents).toBe(0);
    expect(partner.body.shipping_waived).toBe(true);
    expect(partner.body.charge_lines[2].value_cents).toBe(-700);
  });

  it("translates the port's failure contract at the HTTP boundary without exposing vendor details", async () => {
    const adapter = app.get<TestShippingRateAdapter>(SHIPPING_RATE_PROVIDER);
    jest.spyOn(adapter, "getRate").mockRejectedValue(
      new ShippingRateUnavailableError({
        cause: new Error("vendor SDK payload and private credentials"),
      }),
    );
    for (const client of clients()) {
      const response = await request(app.getHttpServer())
        .post(client.path)
        .set(client.header, client.credential)
        .send(client.body)
        .expect(502);
      expect(response.body).toEqual({
        statusCode: 502,
        error: "Bad Gateway",
        message: "Shipping rates are temporarily unavailable",
      });
    }
  });

  it("translates a business invariant failure and avoids a provider call", async () => {
    const adapter = app.get<TestShippingRateAdapter>(SHIPPING_RATE_PROVIDER);
    const providerCall = jest.spyOn(adapter, "getRate");
    const response = await request(app.getHttpServer())
      .post("/checkout/shipping-quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...checkoutBody,
        orderSubtotalCents: Number.MAX_SAFE_INTEGER + 1,
      })
      .expect(400);
    expect(response.body.message).toBe(
      "Subtotal must be a nonnegative safe integer",
    );
    expect(providerCall).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated and malformed requests before calling the service", async () => {
    const serviceCall = jest.spyOn(service, "createQuote");
    const invalidBodies = [
      [
        {},
        partnerBody,
        { ...checkoutBody, weightGrams: 0 },
        { ...checkoutBody, weightGrams: "1500" },
        { ...checkoutBody, destinationCountry: "ZZ" },
        { ...checkoutBody, orderSubtotalCents: -1 },
        { ...checkoutBody, orderSubtotalCents: 1.5 },
        { ...checkoutBody, actorId: "spoofed" },
      ],
      [
        {},
        checkoutBody,
        { ...partnerBody, package_weight_grams: 0 },
        { ...partnerBody, package_weight_grams: "1500" },
        { ...partnerBody, destination_country: "ZZ" },
        { ...partnerBody, order_value_cents: -1 },
        { ...partnerBody, order_value_cents: 1.5 },
        { ...partnerBody, actorId: "spoofed" },
      ],
    ];
    for (const [index, client] of clients().entries()) {
      await request(app.getHttpServer())
        .post(client.path)
        .send(client.body)
        .expect(401);
      await request(app.getHttpServer())
        .post(client.path)
        .set(client.header, "invalid")
        .send(client.body)
        .expect(401);
      for (const body of invalidBodies[index]) {
        await request(app.getHttpServer())
          .post(client.path)
          .set(client.header, client.credential)
          .send(body)
          .expect(400);
      }
    }
    expect(serviceCall).not.toHaveBeenCalled();
  });
});
