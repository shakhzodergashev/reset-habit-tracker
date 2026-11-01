import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClimbsController } from './climbs.controller';
import { InsightsController } from './insights.controller';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [AuthModule], // JwtService for AuthGuard
  controllers: [StatsController, ClimbsController, InsightsController],
  providers: [StatsService],
})
export class StatsModule {}
