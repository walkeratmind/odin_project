import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow web frontend (any origin in dev; Railway's deployed frontend in prod)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // OpenAPI spec
  const config = new DocumentBuilder()
    .setTitle('Odin Work Intake API')
    .setDescription('AI-assisted work item processing system')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/reference-json',
  });

  // Scalar API reference UI
  app.use(
    '/reference',
    apiReference({
      spec: {
        url: '/reference-json',
      },
      theme: 'purple',
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on port ${port}`);
  console.log(`API reference: http://localhost:${port}/reference`);
}
void bootstrap();