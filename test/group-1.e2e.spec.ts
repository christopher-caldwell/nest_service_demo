import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { Group1Module } from "../src/composition/group-1.module";
import { configureApp } from "../src/configure-app";
import { demoConfig } from "../src/auth/demo-config";
import { SessionService } from "../src/auth/session.service";
import { SharedService } from "../src/business/group-1/shared.service";

describe("Group 1 controllers → SharedService", () => {
  let app: INestApplication;
  let jwt: JwtService;
  let service: SharedService;
  let sessions: SessionService;
  let token: string;

  const body1 = {
    name: "demo",
    items: [
      { code: "A", value: 2 },
      { code: "B", value: 3 },
    ],
  };
  const body2 = {
    label: "demo",
    entries: [
      { key: "A", amount: 2 },
      { key: "B", amount: 3 },
    ],
  };
  const body3 = {
    display_name: "demo",
    values: [
      { item_code: "A", item_value: 2 },
      { item_code: "B", item_value: 3 },
    ],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [Group1Module],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    jwt = app.get(JwtService);
    service = app.get(SharedService);
    sessions = app.get(SessionService);
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
        path: "/group-1/controller-1",
        header: "Authorization",
        credential: `Bearer ${token}`,
        body: body1,
      },
      {
        path: "/group-1/controller-2",
        header: "X-Session-Id",
        credential: demoConfig.sessionId,
        body: body2,
      },
      {
        path: "/group-1/controller-3",
        header: "X-Api-Token",
        credential: demoConfig.staticToken,
        body: body3,
      },
    ];
  }

  it("maps different inputs to one command and maps both real entities to distinct responses", async () => {
    const spy = jest.spyOn(service, "execute"); // Calls through to the real service.
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
        name: "demo",
        items: [
          { code: "A", value: 2 },
          { code: "B", value: 3 },
        ],
      });
    }

    const [result1, result2, result3] = spy.mock.results.map(
      (result) => result.value,
    );
    expect(responses[0]).toEqual({
      result: {
        id: result1.entityOne.id,
        name: "demo",
        status: "accepted",
        total: 5,
        items: result1.entityTwos.map(
          (line: { id: string; code: string; value: number }) => ({
            id: line.id,
            code: line.code,
            value: line.value,
          }),
        ),
      },
    });
    expect(responses[1]).toEqual({
      reference: result2.entityOne.id,
      label: "demo",
      accepted: true,
      total: 5,
      entries: result2.entityTwos.map(
        (line: { id: string; code: string; value: number }) => ({
          reference: line.id,
          key: line.code,
          amount: line.value,
        }),
      ),
    });
    expect(responses[2]).toEqual({
      result_id: result3.entityOne.id,
      display_name: "demo",
      state: "ACCEPTED",
      total_value: 5,
      values: result3.entityTwos.map(
        (line: { id: string; code: string; value: number }) => ({
          item_id: line.id,
          item_code: line.code,
          item_value: line.value,
        }),
      ),
    });
    for (const result of [result1, result2, result3]) {
      expect(result.entityOne.createdBy).toBe(demoConfig.actorId);
      expect(result.entityOne.id).toEqual(expect.any(String));
      expect(result.entityTwos).toHaveLength(2);
      expect(result.entityTwos[0].code).toBe("A");
      expect(result.entityTwos[1].value).toBe(3);
      for (const line of result.entityTwos)
        expect(line.entityOneId).toBe(result.entityOne.id);
    }
  });

  it("rejects missing and invalid credentials before calling the business service", async () => {
    const spy = jest.spyOn(service, "execute");
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
    const spy = jest.spyOn(service, "execute");
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
        .post("/group-1/controller-1")
        .set("Authorization", `Bearer ${invalid}`)
        .send(body1)
        .expect(401);
    }
  });

  it("rejects expired and deleted sessions", async () => {
    sessions.set("expired", { id: "someone" }, -1);
    sessions.set("deleted", { id: "someone" }, 60_000);
    sessions.delete("deleted");
    for (const sessionId of ["expired", "deleted"]) {
      await request(app.getHttpServer())
        .post("/group-1/controller-2")
        .set("X-Session-Id", sessionId)
        .send(body2)
        .expect(401);
    }
    expect(sessions.get("expired")).toBeUndefined();
  });

  it("gets the actor from verified credentials rather than client request fields", async () => {
    const spy = jest.spyOn(service, "execute");
    sessions.set("another-user-session", { id: "session-user-42" }, 60_000);
    await request(app.getHttpServer())
      .post("/group-1/controller-2")
      .set("X-Session-Id", "another-user-session")
      .send(body2)
      .expect(201);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: "session-user-42" }),
    );
    await request(app.getHttpServer())
      .post("/group-1/controller-1")
      .set("Authorization", `Bearer ${signToken({ sub: "jwt-user-42" })}`)
      .send(body1)
      .expect(201);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: "jwt-user-42" }),
    );
  });

  it("validates each contract including nested values, empty arrays, and extra fields", async () => {
    const spy = jest.spyOn(service, "execute");
    const malformedBodies = [
      [
        {},
        { ...body1, items: [] },
        { ...body1, items: [{ code: "A", value: 0 }] },
        { ...body1, items: [{ code: "A", value: "2" }] },
        { ...body1, items: [{ code: " ", value: 2 }] },
        { ...body1, name: " " },
        { ...body1, actorId: "spoofed" },
        { ...body1, items: [{ code: "A", value: 2, secret: true }] },
        body2,
      ],
      [
        {},
        { ...body2, entries: [] },
        { ...body2, entries: [{ key: "A", amount: -1 }] },
        { ...body2, entries: [{ key: "A", amount: 1.5 }] },
        { ...body2, label: "" },
        { ...body2, extra: true },
        body1,
      ],
      [
        {},
        { ...body3, values: [] },
        { ...body3, values: [{ item_code: "A", item_value: 0 }] },
        { ...body3, values: [{ item_code: "", item_value: 2 }] },
        { ...body3, display_name: " " },
        { ...body3, extra: true },
        body1,
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
