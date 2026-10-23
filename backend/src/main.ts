import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Check every request body against its DTO rules.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove fields the DTO does not declare
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // turn the plain body into an instance of the DTO class
    }),
  );

  // Run onModuleDestroy hooks (e.g. close the database) when the app is stopped.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

// `void` marks that we intentionally don't wait for this promise here.
void bootstrap();
