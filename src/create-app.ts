import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { loadEnv } from './config/env';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const env = loadEnv();
  app.useLogger(app.get(Logger));
  // Necesar în spatele reverse proxy-ului (Caddy): IP real pentru rate limiting.
  app.set('trust proxy', env.trustProxy);
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: env.corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  if (env.nodeEnv !== 'test' && env.enableSwagger) {
    const swagger = new DocumentBuilder()
      .setTitle("High School Students' App")
      .setDescription('REST API')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document);
  }

  return app;
}
