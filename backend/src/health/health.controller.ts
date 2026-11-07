import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GET /health: "is RESET working?" The host (and uptime alerts) call this
 * every few seconds; anything other than 200 means something is wrong.
 */
@Controller('health')
@SkipThrottle() // checked often, so it must never hit the rate limit
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // The server is up, but can it still reach the database?
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // 503 = "temporarily unable". No details, so nothing leaks to the public.
      throw new ServiceUnavailableException('Database unreachable');
    }
    return { status: 'ok' };
  }
}
