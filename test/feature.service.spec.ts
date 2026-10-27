import { FeatureService } from "../src/business/group-2/feature.service";
import { TestAdapter } from "../src/providers/test.adapter";

it("runs the real business logic with a local adapter", async () => {
  const service = new FeatureService(new TestAdapter());
  const result = await service.execute({ actorId: "demo-user", value: 5 });

  // TestAdapter supplies 10. FeatureService adds 10.
  expect(result.entityOne.total).toBe(20);
  expect(result.entityTwos).toEqual([
    { name: "provider", value: 10 },
    { name: "local", value: 10 },
  ]);
});
