import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { demoConfig } from "./auth/demo-config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(demoConfig.port, "127.0.0.1");
  console.log(`Demo listening at http://localhost:${demoConfig.port}`);
}

void bootstrap();
