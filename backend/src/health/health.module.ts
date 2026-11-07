import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController], // PrismaService comes from the global PrismaModule
})
export class HealthModule {}
