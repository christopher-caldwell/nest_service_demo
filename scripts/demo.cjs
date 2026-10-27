const assert = require("node:assert/strict");
const { credentials } = require("./credentials.cjs");
const { demoConfig } = require("../dist/auth/demo-config");

async function main() {
  const auth = credentials();
  const examples = [
    {
      path: "jwt/orders",
      headers: { Authorization: `Bearer ${auth.jwt}` },
      body: { customerName: "Ada", items: [{ sku: "BOOK", quantity: 2 }] },
    },
    {
      path: "session/orders",
      headers: { "X-Session-Id": auth.sessionId },
      body: { buyerName: "Ada", basket: [{ productCode: "BOOK", units: 2 }] },
    },
    {
      path: "partner/orders",
      headers: { "X-Api-Token": auth.staticToken },
      body: {
        customer_name: "Ada",
        lines: [{ product_code: "BOOK", count: 2 }],
      },
    },
    {
      path: "checkout/shipping-quotes",
      headers: { Authorization: `Bearer ${auth.jwt}` },
      body: {
        destinationCountry: "US",
        weightGrams: 1500,
        orderSubtotalCents: 5000,
      },
    },
    {
      path: "partner/shipping-quotes",
      headers: { "X-Api-Token": auth.staticToken },
      body: {
        destination_country: "US",
        package_weight_grams: 1500,
        order_value_cents: 5000,
      },
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
    "Demo failed. Build the app and start it in another terminal first.",
  );
  console.error(error);
  process.exitCode = 1;
});
