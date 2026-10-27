const { JwtService } = require("@nestjs/jwt");
const { demoConfig } = require("../dist/auth/demo-config");

function credentials() {
  const jwt = new JwtService({ secret: demoConfig.jwtSecret });
  return {
    jwt: jwt.sign(
      { sub: demoConfig.actorId },
      {
        algorithm: "HS256",
        issuer: demoConfig.jwtIssuer,
        audience: demoConfig.jwtAudience,
        expiresIn: "1h",
      },
    ),
    sessionId: demoConfig.sessionId,
    staticToken: demoConfig.staticToken,
  };
}

module.exports = { credentials };
if (require.main === module)
  console.log(JSON.stringify(credentials(), null, 2));
