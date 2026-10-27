import { INestApplication, ValidationPipe } from "@nestjs/common";
import { BusinessExceptionFilter } from "./http/business-exception.filter";

export function configureApp(app: INestApplication): void {
  app.useGlobalFilters(new BusinessExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
