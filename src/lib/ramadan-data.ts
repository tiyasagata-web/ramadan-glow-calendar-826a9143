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

export function generateICS(startOption: StartDate): string {
  const start = startOption === 'feb18' ? new Date(2026, 1, 18) : new Date(2026, 1, 19);

  let cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ramadan2026//EN',
    'CALSCALE:GREGORIAN',
  ];

  // Add first tarawih
  const tarawih = new Date(start);
  tarawih.setDate(tarawih.getDate() - 1);
  cal.push(...vevent('First Tarawih Night', tarawih, 'The first Tarawih prayer of Ramadan 2026.'));

  // Add fasting days
  for (let i = 0; i < 29; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    cal.push(...vevent(`${getOrdinal(i + 1)} Fast — Ramadan`, d, `Day ${i + 1} of Ramadan 2026`));
  }

  // Qadr nights
  [20, 22, 24, 26, 28].forEach(fd => {
    const d = new Date(start);
    d.setDate(d.getDate() + fd - 1);
    cal.push(...vevent(`Laylatul Qadr — ${getOrdinal(fd + 1)} Night`, d, 'Seek Laylatul Qadr on this odd night.'));
  });

  // Eid options
  const eid29 = getEidDate29(startOption);
  cal.push(...vevent('Eid al-Fitr (if 29 days)', eid29, 'Eid al-Fitr if Ramadan is 29 days.'));
  const eid30 = getEidDate30(startOption);
  cal.push(...vevent('Eid al-Fitr (if 30 days)', eid30, 'Eid al-Fitr if Ramadan is 30 days.'));

  cal.push('END:VCALENDAR');
  return cal.join('\r\n');
}

function vevent(summary: string, date: Date, description: string): string[] {
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

export function getGoogleCalendarUrl(startOption: StartDate): string {
  const start = startOption === 'feb18' ? '20260218' : '20260219';
  const end = startOption === 'feb18' ? '20260219' : '20260220';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Start of Ramadan 2026')}&dates=${start}/${end}&details=${encodeURIComponent('The blessed month of Ramadan begins. May it be filled with blessings and peace.')}`;
}
