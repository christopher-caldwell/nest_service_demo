import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { demoConfig } from "../src/auth/demo-config";
import { SessionCacheService } from "../src/auth/session-cache.service";
import { OrdersService } from "../src/business/orders.service";

describe("Three controllers → one business service", () => {
  let app: INestApplication;
  let jwt: JwtService;
  let service: OrdersService;
  let sessions: SessionCacheService;
  let token: string;

  const jwtBody = {
    customerName: "Ada",
    items: [
      { sku: "BOOK", quantity: 2 },
      { sku: "PEN", quantity: 3 },
    ],
  };
  const sessionBody = {
    buyerName: "Ada",
    basket: [
      { productCode: "BOOK", units: 2 },
      { productCode: "PEN", units: 3 },
    ],
  };
  const partnerBody = {
    customer_name: "Ada",
    lines: [
      { product_code: "BOOK", count: 2 },
      { product_code: "PEN", count: 3 },
    ],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    jwt = app.get(JwtService);
    service = app.get(OrdersService);
    sessions = app.get(SessionCacheService);
    token = signToken();
  });

  afterAll(async () => {
    await app?.close();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function signToken(
    payload: Record<string, unknown> = { sub: demoConfig.actorId },
    expiresIn = 3600,
  ): string {
    return jwt.sign(payload, {
      algorithm: "HS256",
      issuer: demoConfig.jwtIssuer,
      audience: demoConfig.jwtAudience,
      expiresIn,
    });
  }

  function clients() {
    return [
      {
        path: "/jwt/orders",
        header: "Authorization",
        credential: `Bearer ${token}`,
        body: jwtBody,
      },
      {
        path: "/session/orders",
        header: "X-Session-Id",
        credential: demoConfig.sessionId,
        body: sessionBody,
      },
      {
        path: "/partner/orders",
        header: "X-Api-Token",
        credential: demoConfig.staticToken,
        body: partnerBody,
      },
    ];
  }

  it("maps different inputs to one command and maps both real entities to distinct responses", async () => {
    const spy = jest.spyOn(service, "createOrder"); // Calls through to the real service.
    const responses = [];
    for (const client of clients()) {
      const response = await request(app.getHttpServer())
        .post(client.path)
        .set(client.header, client.credential)
        .send(client.body)
        .expect(201);
      responses.push(response.body);
    }

    expect(spy).toHaveBeenCalledTimes(3);
    for (const [command] of spy.mock.calls) {
      expect(command).toEqual({
        actorId: demoConfig.actorId,
        customerName: "Ada",
        items: [
          { sku: "BOOK", quantity: 2 },
          { sku: "PEN", quantity: 3 },
        ],
      });
    }

    const [jwtResult, sessionResult, partnerResult] = spy.mock.results.map(
      (result) => result.value,
    );
    expect(responses[0]).toEqual({
      order: {
        id: jwtResult.entityOne.id,
        customerName: "Ada",
        status: "accepted",
        totalQuantity: 5,
        items: jwtResult.entityTwos.map(
          (line: { id: string; sku: string; quantity: number }) => ({
            id: line.id,
            sku: line.sku,
            quantity: line.quantity,
          }),
        ),
      },
    });
    expect(responses[1]).toEqual({
      confirmation: sessionResult.entityOne.id,
      buyer: "Ada",
      accepted: true,
      totalUnits: 5,
      basket: sessionResult.entityTwos.map(
        (line: { id: string; sku: string; quantity: number }) => ({
          lineReference: line.id,
          productCode: line.sku,
          units: line.quantity,
        }),
      ),
    });
    expect(responses[2]).toEqual({
      order_ref: partnerResult.entityOne.id,
      customer_name: "Ada",
      state: "ACCEPTED",
      total_units: 5,
      line_items: partnerResult.entityTwos.map(
        (line: { id: string; sku: string; quantity: number }) => ({
          line_ref: line.id,
          product_code: line.sku,
          count: line.quantity,
        }),
      ),
    });
    for (const result of [jwtResult, sessionResult, partnerResult]) {
      expect(result.entityOne.createdBy).toBe(demoConfig.actorId);
      expect(result.entityOne.id).toEqual(expect.any(String));
      expect(result.entityTwos).toHaveLength(2);
      expect(result.entityTwos[0].sku).toBe("BOOK");
      expect(result.entityTwos[1].quantity).toBe(3);
      for (const line of result.entityTwos)
        expect(line.orderId).toBe(result.entityOne.id);
    }
  });

  it("rejects missing and invalid credentials before calling the business service", async () => {
    const spy = jest.spyOn(service, "createOrder");
    for (const client of clients()) {
      await request(app.getHttpServer())
        .post(client.path)
        .send(client.body)
        .expect(401);
      await request(app.getHttpServer())
        .post(client.path)
        .set(client.header, "invalid")
        .send(client.body)
        .expect(401);
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not accept one controller’s credentials on another controller", async () => {
    const spy = jest.spyOn(service, "createOrder");
    for (const client of clients()) {
      for (const other of clients().filter(
        (candidate) => candidate.path !== client.path,
      )) {
        await request(app.getHttpServer())
          .post(client.path)
          .set(other.header, other.credential)
          .send(client.body)
          .expect(401);
      }
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects expired, unsigned, wrongly signed, and incomplete JWTs", async () => {
    const validOptions = {
      issuer: demoConfig.jwtIssuer,
      audience: demoConfig.jwtAudience,
      expiresIn: 3600,
    };
    const invalidTokens = [
      signToken({ sub: demoConfig.actorId }, -1),
      signToken({ name: "missing subject" }),
      signToken({ sub: "" }),
      jwt.sign(
        { sub: demoConfig.actorId },
        { ...validOptions, secret: "wrong-secret" },
      ),
      jwt.sign(
        { sub: demoConfig.actorId },
        { ...validOptions, issuer: "wrong-issuer" },
      ),
      jwt.sign(
        { sub: demoConfig.actorId },
        { ...validOptions, audience: "wrong-audience" },
      ),
      jwt.sign(
        { sub: demoConfig.actorId },
        { issuer: demoConfig.jwtIssuer, audience: demoConfig.jwtAudience },
      ),
      `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"sub":"demo-user"}').toString("base64url")}.`,
    ];
    for (const invalid of invalidTokens) {
      await request(app.getHttpServer())
        .post("/jwt/orders")
        .set("Authorization", `Bearer ${invalid}`)
        .send(jwtBody)
        .expect(401);
    }
  });

  it("rejects expired and deleted sessions", async () => {
    sessions.set("expired", { id: "someone" }, -1);
    sessions.set("deleted", { id: "someone" }, 60_000);
    sessions.delete("deleted");
    for (const sessionId of ["expired", "deleted"]) {
      await request(app.getHttpServer())
        .post("/session/orders")
        .set("X-Session-Id", sessionId)
        .send(sessionBody)
        .expect(401);
    }
    expect(sessions.get("expired")).toBeUndefined();
  });

  it("gets the actor from verified credentials rather than client request fields", async () => {
    const spy = jest.spyOn(service, "createOrder");
    sessions.set("another-user-session", { id: "session-user-42" }, 60_000);
    await request(app.getHttpServer())
      .post("/session/orders")
      .set("X-Session-Id", "another-user-session")
      .send(sessionBody)
      .expect(201);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: "session-user-42" }),
    );
    await request(app.getHttpServer())
      .post("/jwt/orders")
      .set("Authorization", `Bearer ${signToken({ sub: "jwt-user-42" })}`)
      .send(jwtBody)
      .expect(201);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: "jwt-user-42" }),
    );
  });

  it("validates each contract including nested quantities, empty arrays, and extra fields", async () => {
    const spy = jest.spyOn(service, "createOrder");
    const malformedBodies = [
      [
        {},
        { ...jwtBody, items: [] },
        { ...jwtBody, items: [{ sku: "BOOK", quantity: 0 }] },
        { ...jwtBody, items: [{ sku: "BOOK", quantity: "2" }] },
        { ...jwtBody, items: [{ sku: " ", quantity: 2 }] },
        { ...jwtBody, customerName: " " },
        { ...jwtBody, actorId: "spoofed" },
        { ...jwtBody, items: [{ sku: "BOOK", quantity: 2, secret: true }] },
        sessionBody,
      ],
      [
        {},
        { ...sessionBody, basket: [] },
        { ...sessionBody, basket: [{ productCode: "BOOK", units: -1 }] },
        { ...sessionBody, basket: [{ productCode: "BOOK", units: 1.5 }] },
        { ...sessionBody, buyerName: "" },
        { ...sessionBody, extra: true },
        jwtBody,
      ],
      [
        {},
        { ...partnerBody, lines: [] },
        { ...partnerBody, lines: [{ product_code: "BOOK", count: 0 }] },
        { ...partnerBody, lines: [{ product_code: "", count: 2 }] },
        { ...partnerBody, customer_name: " " },
        { ...partnerBody, extra: true },
        jwtBody,
      ],
    ];
    for (const [index, client] of clients().entries()) {
      for (const body of malformedBodies[index]) {
        await request(app.getHttpServer())
          .post(client.path)
          .set(client.header, client.credential)
          .send(body)
          .expect(400);
      }
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
