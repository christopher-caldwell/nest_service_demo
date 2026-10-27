import "dotenv/config";

// Deliberately public demo credentials; no login controller is needed.
export const demoConfig = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "demo-only-jwt-secret-change-me",
  jwtIssuer: "controller-mapping-demo",
  jwtAudience: "orders-api",
  staticToken: process.env.STATIC_AUTH_TOKEN ?? "demo-static-token",
  sessionId: process.env.DEMO_SESSION_ID ?? "demo-session",
  actorId: "demo-user",
};
