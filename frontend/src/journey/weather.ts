// The weather on the hill. Data comes from Open-Meteo (free, no account or key):
// https://open-meteo.com. Only rough coordinates are sent, and never to our backend.

export type WeatherKind =
  'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface Weather {
  kind: WeatherKind;
  isDay: boolean;
  temperature: number | null; // °C; null when we only guessed day or night
}

/** Without a location: no clouds, just day or night by the device's clock. */
export function fallbackWeather(): Weather {
  const hour = new Date().getHours();
  return { kind: 'clear', isDay: hour >= 6 && hour < 19, temperature: null };
}

/** Open-Meteo sends a WMO weather code (0 = clear sky ... 99 = thunderstorm with hail). */
function kindFromCode(code: number): WeatherKind {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'rain'; // drizzle (51-57), rain (61-67) and showers (80-82)
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<Weather> {
  // Two decimals = about 1 km: plenty for weather, and less precise than the real spot.
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}` +
    '&current=temperature_2m,weather_code,is_day';
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Weather request failed (${response.status})`);
  const data = (await response.json()) as {
    current: { temperature_2m: number; weather_code: number; is_day: number };
  };
  return {
    kind: kindFromCode(data.current.weather_code),
    isDay: data.current.is_day === 1,
    temperature: Math.round(data.current.temperature_2m),
  };
}

const LABELS: Record<WeatherKind, string> = {
  clear: 'Clear',
  partly: 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Thunderstorm',
};

const EMOJIS: Record<WeatherKind, [day: string, night: string]> = {
  clear: ['☀️', '🌙'],
  partly: ['⛅', '☁️'],
  cloudy: ['☁️', '☁️'],
  fog: ['🌫️', '🌫️'],
  rain: ['🌧️', '🌧️'],
  snow: ['🌨️', '🌨️'],
  storm: ['⛈️', '⛈️'],
};

/** "☀️ 18° · Clear", or "🌙 · Clear night" when only the clock was used. */
export function weatherLabel(weather: Weather): string {
  const emoji = EMOJIS[weather.kind][weather.isDay ? 0 : 1];
  const temperature =
    weather.temperature === null ? '' : ` ${weather.temperature}°`;
  const label =
    weather.kind === 'clear' && !weather.isDay
      ? 'Clear night'
      : LABELS[weather.kind];
  return `${emoji}${temperature} · ${label}`;
}

const SKIES: Record<
  WeatherKind,
  [day: [string, string], night: [string, string]]
> = {
  clear: [
    ['#6fb8f0', '#cfe9fb'],
    ['#1a1340', '#3a2d70'],
  ],
  partly: [
    ['#7fb6df', '#dcecf7'],
    ['#1c1642', '#3b3070'],
  ],
  cloudy: [
    ['#9aa9b8', '#dbe2e8'],
    ['#1a2230', '#323d4d'],
  ],
  fog: [
    ['#bcc5cd', '#e6e9ec'],
    ['#2a3038', '#454c55'],
  ],
  rain: [
    ['#6f7f8f', '#b9c4ce'],
    ['#141b25', '#2b3442'],
  ],
  snow: [
    ['#aebfcf', '#eaf0f5'],
    ['#1d2735', '#3b4757'],
  ],
  storm: [
    ['#4a5462', '#87929e'],
    ['#0d1117', '#262d38'],
  ],
};

/** The colours of the scene for this weather. They are the same in light and dark mode. */
export function sceneColors(weather: Weather) {
  const day = weather.isDay;
  const snowy = weather.kind === 'snow';
  const wet = weather.kind === 'rain' || weather.kind === 'storm';
  const [skyTop, skyBottom] = SKIES[weather.kind][day ? 0 : 1];
  return {
    skyTop,
    skyBottom,
    farHill: snowy
      ? day
        ? '#dde8ec'
        : '#56636d'
      : day
        ? '#d3ebae'
        : '#2b3d2d',
    ground: snowy ? (day ? '#f1f6f8' : '#8796a1') : day ? '#a5d36b' : '#3e5c34',
    road: day ? '#5e9e45' : '#8cc96b', // the path up the green hill
    ink: day ? '#17201c' : '#e8edf2', // the bike and the rider's head
    cloud: wet ? (day ? '#c9d1d9' : '#4b5563') : day ? '#ffffff' : '#5b6675',
    rain: day ? '#3b82c4' : '#7fb3e0',
  };
}
