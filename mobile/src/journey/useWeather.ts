import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { fallbackWeather, fetchWeather, type Weather } from './weather';

// Shared by every screen, so switching tabs doesn't ask again. Refreshed after 15 minutes.
let cached: { weather: Weather; at: number } | null = null;
const FRESH_FOR_MS = 15 * 60 * 1000;

/**
 * The weather where the user is. Asks for location permission the first time.
 * Without permission (or offline) it falls back to a clear day or night sky.
 */
export function useWeather(): Weather {
  const [weather, setWeather] = useState<Weather>(() => cached?.weather ?? fallbackWeather());

  useEffect(() => {
    if (cached && Date.now() - cached.at < FRESH_FOR_MS) return;
    let ignore = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      // The last known position is instant; otherwise get a quick, low-accuracy one.
      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      const fresh = await fetchWeather(position.coords.latitude, position.coords.longitude);
      cached = { weather: fresh, at: Date.now() };
      if (!ignore) setWeather(fresh);
    })().catch(() => {
      // No weather is fine: the fallback sky stays.
    });

    return () => {
      ignore = true;
    };
  }, []);

  return weather;
}
