import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/**
 * Applies the shared HTTP configuration (prefix, CORS, security headers,
 * validation pipe and Swagger). Used by both `main.ts` and the e2e tests so
 * the tested app matches production wiring.
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? '*';
  app.enableCors({
    origin:
      corsOrigin === '*'
        ? true
        : corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  app.use(helmet());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription(
      'TaskFlow API - a modular REST backend for managing users, projects, tasks and comments.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addTag('auth', 'Authentication and current user')
    .addTag('users', 'User management (ADMIN only)')
    .addTag('projects', 'Project management')
    .addTag('tasks', 'Task management with filtering and pagination')
    .addTag('comments', 'Comments on tasks')
    .addTag('health', 'Service and database health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
