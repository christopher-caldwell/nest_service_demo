# Nest service demo

Two groups illustrate controller mappings and provider separation using generic names and values.

| Group | Controllers                                                   | Service          | Point                                                     |
| ----- | ------------------------------------------------------------- | ---------------- | --------------------------------------------------------- |
| 1     | `Group1Controller1`, `Group1Controller2`, `Group1Controller3` | `SharedService`  | Different auth and DTO contracts, one business operation  |
| 2     | `Group2Controller1`, `Group2Controller2`                      | `FeatureService` | Same business logic with a live or local provider adapter |

## Run

Node.js 22.14+ and npm:

```sh
npm install
npm run build
npm start
```

In another terminal:

```sh
npm run demo
```

This calls all five routes and prints their different responses. Use `npm run start:dev` for automatic restarts. Optional configuration is in `.env.example`; the defaults work without a `.env` file.

## Group 1: different contracts, SharedService

| POST route              | Auth           | Request fields                                        |
| ----------------------- | -------------- | ----------------------------------------------------- |
| `/group-1/controller-1` | Bearer JWT     | `name`, `items: [{ code, value }]`                    |
| `/group-1/controller-2` | `X-Session-Id` | `label`, `entries: [{ key, amount }]`                 |
| `/group-1/controller-3` | `X-Api-Token`  | `display_name`, `values: [{ item_code, item_value }]` |

Each controller has its own request and response DTOs. Each maps its request into the same command for `SharedService.execute()`:

```ts
{
  actorId: 'demo-user',
  name: 'demo',
  items: [{ code: 'A', value: 2 }]
}
```

The service logs the command, sums the values, and returns two entity types:

```ts
{
  entityOne: {
    id: 'entity-1-id',
    name: 'demo',
    createdBy: 'demo-user',
    status: 'accepted',
    total: 2,
  },
  entityTwos: [
    { id: 'entity-2-id', entityOneId: 'entity-1-id', code: 'A', value: 2 }
  ],
}
```

IDs are generated UUIDs. Each controller then explicitly selects and renames fields from both entities:

- Controller 1 returns `{ result: { id, name, status, total, items } }`.
- Controller 2 returns `{ reference, label, accepted, total, entries }`.
- Controller 3 returns `{ result_id, display_name, state, total_value, values }`.

Start with [group-1-controller-2.controller.ts](src/controllers/group-1-controller-2.controller.ts), then follow the call into [SharedService](src/business/group-1/shared.service.ts). The matching DTO file sits beside each controller.

`SessionService` stores sessions in memory and checks their expiration. The [auth module](src/auth/auth.module.ts) seeds `demo-session` for one hour at startup. It also configures JWT authentication and the static token. Guards normalize verified credentials to `{ id }`; controllers pass that identity to the business service as `actorId`.

Run `npm run credentials` after building to print a fresh JWT and the demo session/static token values. Generating credentials does not renew the server's session. Restart the app to reseed it.

## Group 2: FeatureService and a provider port

| POST route              | Auth          | Request              | Response                             |
| ----------------------- | ------------- | -------------------- | ------------------------------------ |
| `/group-2/controller-1` | Bearer JWT    | `{ value: 5 }`       | `{ result: { id, total, parts } }`   |
| `/group-2/controller-2` | `X-Api-Token` | `{ input_value: 5 }` | `{ result_id, total_value, values }` |

Both controllers map into `FeatureService.execute({ actorId, value })`.

```text
Group2Controller1 ─┐
                  ├─→ FeatureService → ProviderPort
Group2Controller2 ─┘                        ↑ implements
                                  ProviderAdapter / TestAdapter
```

The port accepts `{ value }` and returns `{ value }`. It receives no auth or HTTP objects. The adapters supply the provider result; **FeatureService owns the rule of adding 10**.

| Adapter           | Simulated provider behavior for input 5 | Service adds | Final total |
| ----------------- | --------------------------------------- | ------------ | ----------- |
| `TestAdapter`     | Local calculation: `5 * 2 = 10`         | 10           | 20          |
| `ProviderAdapter` | Simulated live call: `5 * 3 = 15`       | 10           | 25          |

`ProviderAdapter` maps provider-specific `input_value`/`output_value` fields into the port contract. It logs a simulated live call and makes no network request. `TestAdapter` needs no network, SDK, or credentials.

The service returns `{ entityOne: { id, createdBy, total }, entityTwos: [{ name, value }] }`. Each controller remaps those entities into its own response DTO.

### Switch the adapter

Open **[src/composition/provider.binding.ts](src/composition/provider.binding.ts)**. Leave one `useClass` line uncommented:

```ts
export const providerBinding: ClassProvider<ProviderPort> = {
  provide: PROVIDER_PORT,

  useClass: TestAdapter, // TEST: local and deterministic, no provider cost.
  // useClass: ProviderAdapter, // LIVE: simulated external call in this demo.
};
```

Rebuild/restart after switching. Both controllers continue calling the same `FeatureService`; only the provider supplied to its constructor changes.

## Separation at the seams

| Location            | Owns                                                     |
| ------------------- | -------------------------------------------------------- |
| `controllers/`      | API-specific DTOs and request/response mappings          |
| `auth/`             | Auth guards, `SessionService`, and normalized identity   |
| `business/group-1/` | `SharedService`, commands, and entities                  |
| `business/group-2/` | `FeatureService`, commands, entities, and `ProviderPort` |
| `providers/`        | `ProviderAdapter` and `TestAdapter`                      |
| `composition/`      | Nest modules, service factories, and the adapter switch  |
| `http/`             | Business-error to HTTP-response translation              |

Business services are plain TypeScript. They have no Nest decorators, controller DTOs, HTTP exceptions, or concrete adapter imports. DTOs define their own contracts. Business services enforce value invariants for typed callers too, and reject invalid input before provider calls.

Adapters translate provider exceptions into `ProviderError`. The HTTP filter maps it to a stable `502` response without exposing provider details. Invalid input returns `400`; invalid credentials return `401`.

## Test internal logic without provider cost

```sh
npm test
npm run test:group-1
npm run test:group-2
```

Service tests construct the real subject directly:

```ts
const service = new FeatureService(new TestAdapter());
const result = await service.execute({ actorId: "demo-user", value: 5 });
// result.entityOne.total === 20: local provider value 10 + real service logic 10
```

HTTP tests run the real controllers, validation, auth, and service. They replace only the port binding:

```ts
const module = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PROVIDER_PORT)
  .useClass(TestAdapter)
  .compile();
```

A shared test setup forbids constructing `ProviderAdapter` before its code can run. Tests therefore stay local even when the application's adapter switch selects live mode. Architecture checks protect the dependency directions and keep API DTOs independent of business/provider types.

This is a local demo: auth values are public demo credentials, sessions are in memory, entities are returned without persistence, and both adapters are simulated.
