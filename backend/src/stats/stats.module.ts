import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [AuthModule], // JwtService for AuthGuard
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService], // the dashboard shows the journey too
})
export class StatsModule {}
