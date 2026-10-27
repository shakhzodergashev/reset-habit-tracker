import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HabitsModule } from '../habits/habits.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  // AuthModule: JwtService for AuthGuard. HabitsModule: the habit list with streaks.
  imports: [AuthModule, HabitsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
