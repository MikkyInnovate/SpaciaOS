import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { EnvService } from "./config/env.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  const envService = app.get(EnvService);

  // API Versioning Prefix
  app.setGlobalPrefix("api/v1", {
    exclude: ["tester"],
  });

  // CORS Alignment with Frontend
  app.enableCors({
    origin: [envService.frontendUrl, "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Workspace-Id", "Accept"],
    credentials: true,
  });

  // Global Validation Pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global Exception Filter for Canonical Error Format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Response Enveloping & Structured Logging
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor()
  );

  const port = envService.port;
  await app.listen(port);
  logger.log(`Pacia Modular Monolith running on port ${port}`);
  logger.log(`API Base URL: http://localhost:${port}/api/v1`);
}

bootstrap();
