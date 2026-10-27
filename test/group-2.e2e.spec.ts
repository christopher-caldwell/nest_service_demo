import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { demoConfig } from "../src/auth/demo-config";
import { FeatureService } from "../src/business/group-2/feature.service";
import {
  PROVIDER_PORT,
  ProviderError,
} from "../src/business/group-2/provider.port";
import { TestAdapter } from "../src/providers/test.adapter";
import { ProviderAdapter } from "../src/providers/provider.adapter";

describe("Group 2 controllers → FeatureService → TestAdapter", () => {
  let app: INestApplication;
  let service: FeatureService;
  let adapter: TestAdapter;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      // Replace only the external boundary. Run the real service and controllers.
      .overrideProvider(PROVIDER_PORT)
      .useClass(TestAdapter)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    service = app.get(FeatureService);
    adapter = app.get(PROVIDER_PORT);
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
        path: "/group-2/controller-1",
        header: "Authorization",
        credential: `Bearer ${token}`,
        body: { value: 5 },
      },
      {
        path: "/group-2/controller-2",
        header: "X-Api-Token",
        credential: demoConfig.staticToken,
        body: { input_value: 5 },
      },
    ];
  }

  it("fails before live code runs if a test forgets to replace ProviderAdapter", async () => {
    await expect(
      Test.createTestingModule({
        providers: [{ provide: PROVIDER_PORT, useClass: ProviderAdapter }],
      }).compile(),
    ).rejects.toThrow("Live provider construction is forbidden in tests");
  });

  it("maps both API contracts through the same real service", async () => {
    expect(adapter).toBeInstanceOf(TestAdapter);
    const call = jest.spyOn(service, "execute"); // Calls through, no mocked business result.
    const responses = [];
    for (const client of clients()) {
      const response = await request(app.getHttpServer())
        .post(client.path)
        .set(client.header, client.credential)
        .send(client.body)
        .expect(201);
      responses.push(response.body);
    }
    expect(call).toHaveBeenCalledTimes(2);
    for (const [command] of call.mock.calls)
      expect(command).toEqual({ actorId: demoConfig.actorId, value: 5 });
    expect(ProviderAdapter).not.toHaveBeenCalled();
    expect(responses[0]).toEqual({
      result: {
        id: expect.any(String),
        total: 20,
        parts: [
          { name: "provider", value: 10 },
          { name: "local", value: 10 },
        ],
      },
    });
    expect(responses[1]).toEqual({
      result_id: expect.any(String),
      total_value: 20,
      values: [
        { key: "provider", amount: 10 },
        { key: "local", amount: 10 },
      ],
    });
  });

  it("maps provider failures to HTTP without exposing their details", async () => {
    jest
      .spyOn(adapter, "fetchValue")
      .mockRejectedValue(
        new ProviderError({ cause: new Error("Private provider details") }),
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
        message: "Provider unavailable",
      });
    }
  });

  it("maps business validation errors to HTTP before contacting the provider", async () => {
    const call = jest.spyOn(adapter, "fetchValue");
    const response = await request(app.getHttpServer())
      .post("/group-2/controller-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ value: Number.MAX_SAFE_INTEGER + 1 })
      .expect(400);
    expect(response.body.message).toBe(
      "Value must be a nonnegative safe integer",
    );
    expect(call).not.toHaveBeenCalled();
  });

  it("rejects missing/invalid credentials and invalid DTOs before running the service", async () => {
    const call = jest.spyOn(service, "execute");
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
      const field = index === 0 ? "value" : "input_value";
      const wrongBody = index === 0 ? { input_value: 5 } : { value: 5 };
      for (const body of [
        {},
        wrongBody,
        { [field]: -1 },
        { [field]: 1.5 },
        { [field]: "5" },
        { ...client.body, actorId: "spoofed" },
      ]) {
        await request(app.getHttpServer())
          .post(client.path)
          .set(client.header, client.credential)
          .send(body)
          .expect(400);
      }
    }
    expect(call).not.toHaveBeenCalled();
  });
});
