const assert = require("node:assert/strict");
const { credentials } = require("./credentials.cjs");
const { demoConfig } = require("../dist/auth/demo-config");

async function main() {
  const auth = credentials();
  const examples = [
    {
      path: "group-1/controller-1",
      headers: { Authorization: `Bearer ${auth.jwt}` },
      body: { name: "demo", items: [{ code: "A", value: 2 }] },
    },
    {
      path: "group-1/controller-2",
      headers: { "X-Session-Id": auth.sessionId },
      body: { label: "demo", entries: [{ key: "A", amount: 2 }] },
    },
    {
      path: "group-1/controller-3",
      headers: { "X-Api-Token": auth.staticToken },
      body: {
        display_name: "demo",
        values: [{ item_code: "A", item_value: 2 }],
      },
    },
    {
      path: "group-2/controller-1",
      headers: { Authorization: `Bearer ${auth.jwt}` },
      body: { value: 5 },
    },
    {
      path: "group-2/controller-2",
      headers: { "X-Api-Token": auth.staticToken },
      body: { input_value: 5 },
    },
  ];
  for (const example of examples) {
    const response = await fetch(
      `http://127.0.0.1:${demoConfig.port}/${example.path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...example.headers },
        body: JSON.stringify(example.body),
      },
    );
    const result = await response.json();
    assert.equal(response.status, 201, JSON.stringify(result));
    console.log(`\nPOST /${example.path} → ${response.status}`);
    console.log(JSON.stringify(result, null, 2));
  }
}
main().catch((error) => {
  console.error(
    "Build the app and start it in another terminal before running the demo.",
  );
  console.error(error);
  process.exitCode = 1;
});
