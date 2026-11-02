import { Controller, Get } from '@nestjs/common';

// Every time zone name this server knows, e.g. "Asia/Tashkent", sorted.
// Worked out once, at start-up. UTC is added because Node leaves it out.
const TIME_ZONES = [...Intl.supportedValuesOf('timeZone'), 'UTC'].sort();

@Controller('time-zones')
export class TimeZonesController {
  // GET /time-zones -> the list the apps show in their time zone picker.
  // No login needed: it's the same public list for everyone.
  @Get()
  list(): string[] {
    return TIME_ZONES;
  }
}
