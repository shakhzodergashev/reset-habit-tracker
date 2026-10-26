import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HabitsModule } from '../habits/habits.module';
import { CompletionsController } from './completions.controller';
import { CompletionsService } from './completions.service';

@Module({
  // AuthModule: JwtService for AuthGuard. HabitsModule: the shared ownership check.
  imports: [AuthModule, HabitsModule],
  controllers: [CompletionsController],
  providers: [CompletionsService],
})
export class CompletionsModule {}
