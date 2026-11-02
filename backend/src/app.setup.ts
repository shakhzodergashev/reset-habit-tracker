import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/**
 * App-wide settings, shared by main.ts and the e2e tests
 * so the tests run exactly the same app as production.
 */
export function configureApp(app: INestApplication): void {
  // Security headers on every response (e.g. no sniffing, no framing).
  app.use(helmet());

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
}
