export interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  lastThirdBegins: string;
}

export interface LocationData {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

const CALCULATION_METHOD = 2; // ISNA (Islamic Society of North America)
const METHOD_NAME = "ISNA (Islamic Society of North America)";

export { METHOD_NAME };

// Cache to avoid re-fetching the same date/location
const cache = new Map<string, PrayerTimesData>();

function cacheKey(date: Date, lat: number, lng: number): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${lat.toFixed(4)}-${lng.toFixed(4)}`;
}

function formatTime12(timeStr: string): string {
  // AlAdhan returns "HH:MM (TZ)" — strip timezone
  const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
  const [h, m] = clean.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime12(totalMinutes: number): string {
  let mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function calculateLastThird(maghribStr: string, fajrNextStr: string): string {
  const maghribMins = parseTimeToMinutes(maghribStr);
  let fajrMins = parseTimeToMinutes(fajrNextStr);
  
  // Fajr is next day, so add 24 hours
  if (fajrMins <= maghribMins) {
    fajrMins += 1440;
  }
  
  const nightDuration = fajrMins - maghribMins;
  const lastThirdBegins = fajrMins - Math.floor(nightDuration / 3);
  
  return minutesToTime12(lastThirdBegins);
}

export async function fetchPrayerTimes(
  date: Date,
  location: LocationData
): Promise<PrayerTimesData> {
  const key = cacheKey(date, location.latitude, location.longitude);
  const cached = cache.get(key);
  if (cached) return cached;

  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();

  // Fetch current day and next day (for last third calculation)
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const ndd = nextDay.getDate();
  const nmm = nextDay.getMonth() + 1;
  const nyyyy = nextDay.getFullYear();

  const [todayRes, nextRes] = await Promise.all([
    fetch(
      `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${location.latitude}&longitude=${location.longitude}&method=${CALCULATION_METHOD}`
    ),
    fetch(
      `https://api.aladhan.com/v1/timings/${ndd}-${nmm}-${nyyyy}?latitude=${location.latitude}&longitude=${location.longitude}&method=${CALCULATION_METHOD}`
    ),
  ]);

  if (!todayRes.ok || !nextRes.ok) {
    throw new Error('Failed to fetch prayer times');
  }

  const todayData = await todayRes.json();
  const nextData = await nextRes.json();

  const timings = todayData.data.timings;
  const nextTimings = nextData.data.timings;

  const result: PrayerTimesData = {
    fajr: formatTime12(timings.Fajr),
    sunrise: formatTime12(timings.Sunrise),
    dhuhr: formatTime12(timings.Dhuhr),
    asr: formatTime12(timings.Asr),
    maghrib: formatTime12(timings.Maghrib),
    isha: formatTime12(timings.Isha),
    lastThirdBegins: calculateLastThird(timings.Maghrib, nextTimings.Fajr),
  };

  cache.set(key, result);
  return result;
}

// US cities with coordinates for manual selection
export const US_CITIES: { city: string; state: string; lat: number; lng: number; tz: string }[] = [
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.006, tz: "America/New_York" },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437, tz: "America/Los_Angeles" },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298, tz: "America/Chicago" },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, tz: "America/Chicago" },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074, tz: "America/Phoenix" },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652, tz: "America/New_York" },
  { city: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936, tz: "America/Chicago" },
  { city: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611, tz: "America/Los_Angeles" },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, tz: "America/Chicago" },
  { city: "Detroit", state: "MI", lat: 42.3314, lng: -83.0458, tz: "America/Detroit" },
  { city: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194, tz: "America/Los_Angeles" },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321, tz: "America/Los_Angeles" },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, tz: "America/Denver" },
  { city: "Washington", state: "DC", lat: 38.9072, lng: -77.0369, tz: "America/New_York" },
  { city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388, tz: "America/New_York" },
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589, tz: "America/New_York" },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, tz: "America/New_York" },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265, tz: "America/Chicago" },
  { city: "Tampa", state: "FL", lat: 27.9506, lng: -82.4572, tz: "America/New_York" },
  { city: "Orlando", state: "FL", lat: 28.5383, lng: -81.3792, tz: "America/New_York" },
  { city: "St. Louis", state: "MO", lat: 38.627, lng: -90.1994, tz: "America/Chicago" },
  { city: "Pittsburgh", state: "PA", lat: 40.4406, lng: -79.9959, tz: "America/New_York" },
  { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, tz: "America/New_York" },
  { city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988, tz: "America/New_York" },
  { city: "Indianapolis", state: "IN", lat: 39.7684, lng: -86.1581, tz: "America/Indiana/Indianapolis" },
  { city: "San Jose", state: "CA", lat: 37.3382, lng: -121.8863, tz: "America/Los_Angeles" },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431, tz: "America/Chicago" },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, tz: "America/Chicago" },
  { city: "Las Vegas", state: "NV", lat: 36.1699, lng: -115.1398, tz: "America/Los_Angeles" },
  { city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784, tz: "America/Los_Angeles" },
  { city: "Dearborn", state: "MI", lat: 42.3223, lng: -83.1763, tz: "America/Detroit" },
  { city: "Paterson", state: "NJ", lat: 40.9168, lng: -74.1718, tz: "America/New_York" },
  { city: "Irving", state: "TX", lat: 32.814, lng: -96.9489, tz: "America/Chicago" },
  { city: "Hamtramck", state: "MI", lat: 42.3953, lng: -83.0497, tz: "America/Detroit" },
  { city: "Jersey City", state: "NJ", lat: 40.7178, lng: -74.0431, tz: "America/New_York" },
];

export function getDefaultLocation(): LocationData {
  return {
    city: "New York",
    state: "NY",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
  };
}
