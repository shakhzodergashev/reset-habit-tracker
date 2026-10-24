import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  imports: [AuthModule], // provides JwtService, which AuthGuard needs
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
