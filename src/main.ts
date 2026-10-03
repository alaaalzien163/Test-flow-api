import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);

  Logger.log(
    `TaskFlow API is running on http://localhost:${port}/api/v1`,
    'Bootstrap',
  );
  Logger.log(`Swagger docs available at /docs`, 'Bootstrap');
  Logger.log(`Health check available at /health`, 'Bootstrap');
}

void bootstrap();
