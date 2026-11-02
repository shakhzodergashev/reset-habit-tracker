import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CompletionsModule } from './completions/completions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HabitsModule } from './habits/habits.module';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Loads backend/.env and makes its values available everywhere in the app.
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: at most 120 requests a minute from one address, on every
    // route. Login and register have stricter limits (see AuthController).
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
      errorMessage: 'Too many requests. Please wait a minute and try again.',
      // The e2e tests make many requests quickly, so they turn it off
      // (except the test that checks the limit itself).
      skipIf: () => process.env.RATE_LIMIT_OFF === '1',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HabitsModule,
    CompletionsModule,
    DashboardModule,
    StatsModule,
  ],
  // ThrottlerGuard checks the limits on every request.
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
