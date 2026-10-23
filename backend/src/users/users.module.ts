import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule], // provides JwtService, which AuthGuard needs
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
