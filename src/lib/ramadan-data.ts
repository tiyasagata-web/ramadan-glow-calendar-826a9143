import { fetchPrayerTimes, type LocationData, type PrayerTimesData } from './prayer-times';

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
  fastingDay: number | null;
  isFirstTarawih: boolean;
  isLastTen: boolean;
  isQadrNight: boolean;
  qadrNightNumber: number | null;
  isDualEidCell: boolean;
  isEidIf30: boolean;
  isMuted: boolean;
}

export type StartDate = 'feb18' | 'feb19';

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function generateCalendarDays(startOption: StartDate): CalendarDay[] {
  const startDate = startOption === 'feb18'
    ? new Date(2026, 1, 18)
    : new Date(2026, 1, 19);

  const firstTarawih = new Date(startDate);
  firstTarawih.setDate(firstTarawih.getDate() - 1);

  const rangeStart = new Date(2026, 1, 15);
  const rangeEnd = new Date(2026, 2, 21);

  const days: CalendarDay[] = [];
  const current = new Date(rangeStart);

  while (current <= rangeEnd) {
    const diffMs = current.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    const fastingDay = (diffDays >= 0 && diffDays < 29) ? diffDays + 1 : null;
    const isFirstTarawih = current.toDateString() === firstTarawih.toDateString();

    // Last 10 fasting days: days 21-29
    const isLastTen = fastingDay !== null && fastingDay >= 21;

    // Qadr nights (21st,23rd,25th,27th,29th) occur evenings of days 20,22,24,26,28
    const qadrFastingDays = [20, 22, 24, 26, 28];
    const isQadrNight = fastingDay !== null && qadrFastingDays.includes(fastingDay);
    const qadrNightNumber = isQadrNight && fastingDay ? fastingDay + 1 : null;

    // Dual cell: 30th fast OR Eid if 29 days
    const isDualEidCell = diffDays === 29;
    // Eid if 30 days
    const isEidIf30 = diffDays === 30;

    const isMuted = !fastingDay && !isFirstTarawih && !isDualEidCell && !isEidIf30;

    days.push({
      date: new Date(current),
      dayOfMonth: current.getDate(),
      month: current.getMonth(),
      dayOfWeek: current.getDay(),
      fastingDay,
      isFirstTarawih,
      isLastTen,
      isQadrNight,
      qadrNightNumber,
      isDualEidCell,
      isEidIf30,
      isMuted,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getPrayerTimes(date: Date): PrayerTimes {
  const month = date.getMonth();
  const day = date.getDate();

  if (month === 1) {
    if (day <= 20) {
      return { fajr: '5:50 AM', dhuhr: '12:10 PM', asr: '3:22 PM', maghrib: '5:32 PM', isha: '6:52 PM' };
    }
    return { fajr: '5:38 AM', dhuhr: '12:09 PM', asr: '3:32 PM', maghrib: '5:44 PM', isha: '7:02 PM' };
  }
  // March - DST starts Mar 8
  if (day <= 7) {
    return { fajr: '5:28 AM', dhuhr: '12:07 PM', asr: '3:42 PM', maghrib: '5:55 PM', isha: '7:14 PM' };
  }
  if (day <= 14) {
    return { fajr: '6:15 AM', dhuhr: '1:04 PM', asr: '4:50 PM', maghrib: '7:04 PM', isha: '8:22 PM' };
  }
  return { fajr: '6:02 AM', dhuhr: '1:02 PM', asr: '4:56 PM', maghrib: '7:12 PM', isha: '8:30 PM' };
}

export function getEidDate29(startOption: StartDate): Date {
  return startOption === 'feb18' ? new Date(2026, 2, 19) : new Date(2026, 2, 20);
}

export function getEidDate30(startOption: StartDate): Date {
  return startOption === 'feb18' ? new Date(2026, 2, 20) : new Date(2026, 2, 21);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatShortDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatEidLabel(date: Date): string {
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function pad2(n: number) { return n < 10 ? '0' + n : '' + n; }

function icsDate(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/** Parse "H:MM AM/PM" into { hour24, minute } */
function parse12to24(time12: string): { hour: number; minute: number } {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 0, minute: 0 };
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { hour: h, minute: m };
}

function icsDateTime(d: Date, time12: string, tz: string): string {
  const { hour, minute } = parse12to24(time12);
  return `TZID=${tz}:${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(hour)}${pad2(minute)}00`;
}

function veventAllDay(summary: string, date: Date, description: string): string[] {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${icsDate(date)}`,
    `DTEND;VALUE=DATE:${icsDate(next)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
  ];
}

function veventTimed(summary: string, date: Date, startTime: string, durationMins: number, tz: string, description: string): string[] {
  const { hour, minute } = parse12to24(startTime);
  const endTotal = hour * 60 + minute + durationMins;
  const endH = Math.floor(endTotal / 60) % 24;
  const endM = endTotal % 60;
  return [
    'BEGIN:VEVENT',
    `DTSTART;${icsDateTime(date, startTime, tz)}`,
    `DTEND;TZID=${tz}:${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(endH)}${pad2(endM)}00`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
  ];
}

export async function generateICS(startOption: StartDate, location: LocationData): Promise<string> {
  const start = startOption === 'feb18' ? new Date(2026, 1, 18) : new Date(2026, 1, 19);

  // Fetch prayer times for all days (tarawih + 29 fasting days + eid)
  const allDates: Date[] = [];
  const tarawih = new Date(start);
  tarawih.setDate(tarawih.getDate() - 1);
  allDates.push(new Date(tarawih));
  for (let i = 0; i < 31; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    allDates.push(new Date(d));
  }

  // Fetch prayer times in small batches with delays and retries to avoid API rate limiting
  const prayerMap = new Map<string, PrayerTimesData>();
  const BATCH_SIZE = 2;
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const fetchWithRetry = async (d: Date, retries = 3): Promise<PrayerTimesData | null> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fetchPrayerTimes(d, location);
      } catch {
        if (attempt < retries - 1) await delay(500 * (attempt + 1));
      }
    }
    return null;
  };

  for (let b = 0; b < allDates.length; b += BATCH_SIZE) {
    const batch = allDates.slice(b, b + BATCH_SIZE);
    const results = await Promise.all(batch.map(d => fetchWithRetry(d)));
    batch.forEach((d, i) => {
      if (results[i]) prayerMap.set(d.toDateString(), results[i]!);
    });
    if (b + BATCH_SIZE < allDates.length) await delay(400);
  }

  const tz = location.timezone;

  let cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ramadan2026//EN',
    'CALSCALE:GREGORIAN',
  ];

  // First Tarawih
  const tarawihPrayers = prayerMap.get(tarawih.toDateString());
  if (tarawihPrayers) {
    cal.push(...veventTimed('First Tarawih Night', tarawih, tarawihPrayers.isha, 120, tz, 'The first Tarawih prayer of Ramadan 2026.'));
  } else {
    cal.push(...veventAllDay('First Tarawih Night', tarawih, 'The first Tarawih prayer of Ramadan 2026.'));
  }

  // Fasting days with prayer times (30 days to cover both 29 and 30 day scenarios)
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayNum = i + 1;
    const p = prayerMap.get(d.toDateString());
    const prayerDesc = p
      ? `Imsak: ${p.imsak}\\nFajr: ${p.fajr}\\nSunrise: ${p.sunrise}\\nDhuhr: ${p.dhuhr}\\nAsr (Standard): ${p.asr}\\nAsr (Hanafi): ${p.asrHanafi}\\nMaghrib: ${p.maghrib}\\nIsha: ${p.isha}\\nLast Third: ${p.lastThirdBegins}`
      : '';

    // All-day fasting event (30th is conditional)
    const summary = dayNum === 30
      ? `${getOrdinal(dayNum)} Fast — Ramadan (if 30 days)`
      : `${getOrdinal(dayNum)} Fast — Ramadan`;
    const desc = dayNum === 30
      ? `Day ${dayNum} of Ramadan 2026 (if Ramadan is 30 days). ${prayerDesc}`
      : `Day ${dayNum} of Ramadan 2026. ${prayerDesc}`;
    cal.push(...veventAllDay(summary, d, desc));

    // Individual prayer events
    if (p) {
      const daySuffix = dayNum === 30 ? ` (if 30 days)` : '';
      cal.push(...veventTimed(`Imsak — Day ${dayNum}${daySuffix}`, d, p.imsak, 10, tz, `Imsak (precautionary stop time) - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Fajr — Day ${dayNum}${daySuffix}`, d, p.fajr, 30, tz, `Fajr prayer - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Sunrise — Day ${dayNum}${daySuffix}`, d, p.sunrise, 10, tz, `Sunrise - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Dhuhr — Day ${dayNum}${daySuffix}`, d, p.dhuhr, 30, tz, `Dhuhr prayer - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Asr (Standard) — Day ${dayNum}${daySuffix}`, d, p.asr, 30, tz, `Asr prayer (Shafi'i, Maliki, Hanbali) - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Asr (Hanafi) — Day ${dayNum}${daySuffix}`, d, p.asrHanafi, 30, tz, `Asr prayer (Hanafi madhab) - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Maghrib — Day ${dayNum}${daySuffix}`, d, p.maghrib, 15, tz, `Maghrib prayer / Iftar - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Isha — Day ${dayNum}${daySuffix}`, d, p.isha, 30, tz, `Isha prayer - ${location.city}, ${location.state}`));
      cal.push(...veventTimed(`Last Third Begins — Day ${dayNum}${daySuffix}`, d, p.lastThirdBegins, 15, tz, `Last third of the night begins - ${location.city}, ${location.state}`));
    }

    // Qadr nights
    const qadrFastingDays = [20, 22, 24, 26, 28];
    if (qadrFastingDays.includes(dayNum) && p) {
      cal.push(...veventTimed(`Laylatul Qadr — ${getOrdinal(dayNum + 1)} Night`, d, p.maghrib, 180, tz, 'Seek Laylatul Qadr on this odd night.'));
    }

    // Last 10 marker
    if (dayNum === 21) {
      cal.push(...veventAllDay('Last 10 Nights Begin', d, 'The last 10 nights of Ramadan begin.'));
    }
  }

  // Validation: ensure all 30 fasting days have prayer data
  let missingDays = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (!prayerMap.has(d.toDateString())) missingDays++;
  }
  if (missingDays > 0) {
    throw new Error(`Failed to generate calendar: ${missingDays} fasting day(s) are missing prayer time data. Please try again.`);
  }

  // Eid options
  const eid29 = getEidDate29(startOption);
  cal.push(...veventAllDay('Eid al-Fitr (if 29 days)', eid29, 'Eid al-Fitr if Ramadan is 29 days.'));
  const eid30 = getEidDate30(startOption);
  cal.push(...veventAllDay('Eid al-Fitr (if 30 days)', eid30, 'Eid al-Fitr if Ramadan is 30 days.'));

  cal.push('END:VCALENDAR');
  return cal.join('\r\n');
}

export function getGoogleCalendarUrl(startOption: StartDate): string {
  const start = startOption === 'feb18' ? '20260218' : '20260219';
  const end = startOption === 'feb18' ? '20260219' : '20260220';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Start of Ramadan 2026')}&dates=${start}/${end}&details=${encodeURIComponent('The blessed month of Ramadan begins. May it be filled with blessings and peace.')}`;
}
