import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { demoConfig } from "../src/auth/demo-config";
import { SharedService } from "../src/shared/shared.service";
import { PROVIDER_PORT } from "../src/adapter/provider.port";
import { TestAdapter } from "../src/adapter/adapters/test.adapter";

let app: INestApplication;
let token: string;

beforeAll(async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PROVIDER_PORT)
    .useClass(TestAdapter)
    .compile();
  app = module.createNestApplication({ logger: false });
  await app.init();
  token = app.get(JwtService).sign({ sub: demoConfig.actorId });
});
afterAll(async () => {
  await app.close();
});

it("maps all five DTO contracts through the real services", async () => {
  const shared = jest.spyOn(app.get(SharedService), "execute");
  const examples = [
    {
      path: "/shared/jwt",
      header: "Authorization",
      token: `Bearer ${token}`,
      body: { name: "demo", items: [{ code: "A", value: 2 }] },
      response: {
        result: {
          id: expect.any(String),
          name: "demo",
          status: "accepted",
          total: 2,
          items: [{ id: expect.any(String), code: "A", value: 2 }],
        },
      },
    },
    {
      path: "/shared/session",
      header: "X-Session-Id",
      token: demoConfig.sessionId,
      body: { label: "demo", entries: [{ key: "A", amount: 2 }] },
      response: {
        reference: expect.any(String),
        label: "demo",
        accepted: true,
        total: 2,
        entries: [{ reference: expect.any(String), key: "A", amount: 2 }],
      },
    },
    {
      path: "/shared/token",
      header: "X-Api-Token",
      token: demoConfig.staticToken,
      body: {
        display_name: "demo",
        values: [{ item_code: "A", item_value: 2 }],
      },
      response: {
        result_id: expect.any(String),
        display_name: "demo",
        state: "ACCEPTED",
        total_value: 2,
        values: [
          { item_id: expect.any(String), item_code: "A", item_value: 2 },
        ],
      },
    },
    {
      path: "/adapter/jwt",
      header: "Authorization",
      token: `Bearer ${token}`,
      body: { value: 5 },
      response: {
        result: {
          id: expect.any(String),
          total: 20,
          parts: [
            { name: "provider", value: 10 },
            { name: "local", value: 10 },
          ],
        },
      },
    },
    {
      path: "/adapter/token",
      header: "X-Api-Token",
      token: demoConfig.staticToken,
      body: { input_value: 5 },
      response: {
        result_id: expect.any(String),
        total_value: 20,
        values: [
          { key: "provider", amount: 10 },
          { key: "local", amount: 10 },
        ],
      },
    },
  ];

  for (const example of examples) {
    const response = await request(app.getHttpServer())
      .post(example.path)
      .set(example.header, example.token)
      .send(example.body)
      .expect(201);
    expect(response.body).toEqual(example.response);
  }
  expect(shared).toHaveBeenCalledTimes(3);
  for (const [command] of shared.mock.calls) {
    expect(command).toEqual({
      actorId: demoConfig.actorId,
      name: "demo",
      items: [{ code: "A", value: 2 }],
    });
  }
});
