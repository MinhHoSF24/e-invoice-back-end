/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { initTracing } from '@common/observability/tracing/tracing';

initTracing('bff-service');

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from '@common/observability/logger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      rawBody: true,
      bufferLogs: true,
    });
    app.useLogger(app.get(PinoLogger));
    const globalPrefix = AppModule.CONFIGURATION.GLOBAL_PREFIX;
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(
      new ValidationPipe({
        // whitelist: true,
        transform: true,
      }),
    );
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const port = AppModule.CONFIGURATION.APP_CONFIG.PORT;
    const config = new DocumentBuilder()
      .setTitle('EInvoice-bff API')
      .setDescription('The EInvoice-bff API description')
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      })
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, documentFactory());
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);

    Logger.log(`🚀 Swagger is running on: http://localhost:${port}/${globalPrefix}/docs`);
  } catch (error) {
    Logger.error('Application failed to start: ' + error);
    process.exit(1);
  }
}

bootstrap();
