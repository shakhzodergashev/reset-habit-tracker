import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HabitsModule } from '../habits/habits.module';
import { StatsModule } from '../stats/stats.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  // AuthModule: JwtService for AuthGuard. HabitsModule: habits with streaks. StatsModule: the journey.
  imports: [AuthModule, HabitsModule, StatsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
