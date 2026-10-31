import { useEffect, useState } from 'react';
import { fallbackWeather, fetchWeather, type Weather } from './weather';

// Shared by every page, so switching tabs doesn't ask again. Refreshed after 15 minutes.
let cached: { weather: Weather; at: number } | null = null;
const FRESH_FOR_MS = 15 * 60 * 1000;

/** The browser's location, as a promise. Fails if the user says no. */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('No location in this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, // a rough position is enough for weather
      maximumAge: FRESH_FOR_MS,
      timeout: 10_000,
    });
  });
}

/**
 * The weather where the user is. The browser asks for location permission the first time.
 * Without permission (or offline) it falls back to a clear day or night sky.
 */
export function useWeather(): Weather {
  const [weather, setWeather] = useState<Weather>(
    () => cached?.weather ?? fallbackWeather(),
  );

  useEffect(() => {
    if (cached && Date.now() - cached.at < FRESH_FOR_MS) return;
    let ignore = false;

    currentPosition()
      .then((position) =>
        fetchWeather(position.coords.latitude, position.coords.longitude),
      )
      .then((fresh) => {
        cached = { weather: fresh, at: Date.now() };
        if (!ignore) setWeather(fresh);
      })
      .catch(() => {
        // No weather is fine: the fallback sky stays.
      });

    return () => {
      ignore = true;
    };
  }, []);

  return weather;
}
