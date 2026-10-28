# Nest service demo

Five controllers, two services, two ideas. This is a happy-path concept demo using simple names and values.

## Run

Node.js 22.14+:

```sh
npm install
npm run build
npm start
```

In another terminal, call all five routes and print their responses:

```sh
npm run demo
```

Use `npm run start:dev` for automatic restarts. `npm run credentials` prints a JWT, session ID, and static token for manual requests. Demo credentials live in [demo-config.ts](src/auth/demo-config.ts).

## Layout

```text
src/
  app.module.ts
  main.ts
  auth/                 # Guards, SessionService, auth module
  shared/
    shared.module.ts
    shared.service.ts
    shared.models.ts
    controllers/        # jwt, session, token
    dto/                # jwt, session, token
  adapter/
    adapter.module.ts
    feature.service.ts
    feature.service.spec.ts
    feature.models.ts
    controllers/        # jwt, token
    dto/                # jwt, token
    provider.port.ts
    provider.binding.ts # Toggle the adapter here
    adapters/
      provider.adapter.ts
      test.adapter.ts
```

Each feature contains its module, controllers, DTOs, service, and supporting files. The application imports `SharedModule` and `AdapterModule`; both import `AuthModule`.

## Shared: different DTOs and auth, one SharedService

| POST route        | Auth         | Request fields                                        |
| ----------------- | ------------ | ----------------------------------------------------- |
| `/shared/jwt`     | JWT          | `name`, `items: [{ code, value }]`                    |
| `/shared/session` | Session ID   | `label`, `entries: [{ key, amount }]`                 |
| `/shared/token`   | Static token | `display_name`, `values: [{ item_code, item_value }]` |

Each controller owns its request and response DTOs. Each maps its input to the same command:

```ts
{ actorId: 'demo-user', name: 'demo', items: [{ code: 'A', value: 2 }] }
```

`SharedService` logs the command, sums the values, and returns `{ entityOne, entityTwos }`. Each controller maps both entities to a different response shape. Auth stays in guards; `SessionService` holds the demo session in a Map.

Read [session.controller.ts](src/shared/controllers/session.controller.ts) alongside [shared.service.ts](src/shared/shared.service.ts).

## Adapter: same FeatureService, different adapters

| POST route       | Auth         | Request              | Response                             |
| ---------------- | ------------ | -------------------- | ------------------------------------ |
| `/adapter/jwt`   | JWT          | `{ value: 5 }`       | `{ result: { id, total, parts } }`   |
| `/adapter/token` | Static token | `{ input_value: 5 }` | `{ result_id, total_value, values }` |

```text
JwtController ─┐
                  ├─→ FeatureService → ProviderPort
TokenController ─┘                        ↑ implements
                                  ProviderAdapter / TestAdapter
```

`FeatureService` asks the port for a value, then adds 10. Both controllers call that same service and map its `{ entityOne, entityTwos }` result to their own DTOs.

- `TestAdapter` supplies `input * 2` locally. Input 5 gives a final total of **20**.
- `ProviderAdapter` simulates a live call supplying `input * 3`. Input 5 gives a final total of **25**. It makes no network request.

The service knows only the port. The adapter handles provider-specific fields.

## Switch adapters

Open **[src/adapter/provider.binding.ts](src/adapter/provider.binding.ts)** and leave one line uncommented:

```ts
useClass: TestAdapter, // TEST: local, no provider cost.
// useClass: ProviderAdapter, // LIVE: simulated external call.
```

Rebuild/restart after switching. Controllers and business logic stay the same; the module supplies a different adapter to `FeatureService`.

## Test our logic without provider cost

```sh
npm test
```

The service test runs the real logic with a local adapter:

```ts
const service = new FeatureService(new TestAdapter());
const result = await service.execute({ actorId: "demo-user", value: 5 });
expect(result.entityOne.total).toBe(20);
```

The HTTP test checks all five mappings using real controllers and services. It overrides `PROVIDER_PORT` with `TestAdapter`, keeping provider calls local regardless of the app's selected adapter. Business services are plain TypeScript; each feature module wires together its own controllers and services.
