import { CalendarDay, getOrdinal, formatEidLabel, getEidDate29, getEidDate30, type StartDate } from "@/lib/ramadan-data";
import { Moon, Star } from "lucide-react";

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  days: CalendarDay[];
  startOption: StartDate;
  onDayClick: (day: CalendarDay) => void;
}

export function MobileCalendar({ days, startOption, onDayClick }: Props) {
  const eid29 = getEidDate29(startOption);
  const eid30 = getEidDate30(startOption);

  // Group days into sections of 9
  const sections: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 9) {
    sections.push(days.slice(i, i + 9));
  }

  return (
    <section className="max-w-md mx-auto px-4 pb-12">
      <p className="text-left text-sm text-muted-foreground font-medium mb-5">
        Tap any day to view full prayer times.
      </p>

      {sections.map((section, si) => {
        // Determine month title from first day in section
        const firstMonth = section[0].month;
        const lastMonth = section[section.length - 1].month;
        const monthLabel = firstMonth === lastMonth
          ? `${MONTH_NAMES[firstMonth]} 2026`
          : `${MONTH_NAMES[firstMonth]} → ${MONTH_NAMES[lastMonth]} 2026`;

        return (
          <div key={si} className="mb-6">
            <h3 className="font-display text-lg font-bold month-gradient mb-3">
              {monthLabel}
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {section.map((day, di) => (
                <MobileCell
                  key={di}
                  day={day}
                  eid29={eid29}
                  eid30={eid30}
                  onClick={() => onDayClick(day)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Dual Eid note */}
      <div className="mt-4 text-center text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-4 border border-border">
        <p>Eid al-Fitr if 29 days: <strong className="text-ramadan-eid">{formatEidLabel(eid29)}</strong></p>
        <p>Eid al-Fitr if 30 days: <strong className="text-ramadan-eid">{formatEidLabel(eid30)}</strong></p>
        <p className="mt-2 text-xs">Exact date depends on local moon sighting.</p>
      </div>
    </section>
  );
}

function MobileCell({ day, eid29, eid30, onClick }: { day: CalendarDay; eid29: Date; eid30: Date; onClick: () => void }) {
  // Base styling — spacious, rounded, tap-friendly
  let cellClass = "relative rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center overflow-hidden ";
  cellClass += "min-h-[100px] p-3 ";

  // Shadow/border base
  if (day.isMuted) {
    cellClass += "bg-muted/20 text-muted-foreground/40";
  } else if (day.isDualEidCell) {
    cellClass += "bg-gradient-to-b from-ramadan-eid/20 to-ramadan-amber/15 border border-ramadan-eid/30 shadow-sm";
  } else if (day.isEidIf30) {
    cellClass += "bg-ramadan-eid/15 border border-ramadan-eid/30 glow-border-eid shadow-sm";
  } else if (day.isFirstTarawih) {
    cellClass += "bg-ramadan-tarawih/12 border border-ramadan-tarawih/25 glow-border-tarawih shadow-sm";
  } else if (day.isQadrNight) {
    cellClass += "bg-ramadan-qadr/20 border border-ramadan-qadr/40 glow-border-qadr shadow-sm";
  } else if (day.isLastTen) {
    cellClass += "bg-ramadan-sunset/25 border border-ramadan-sunset/45 glow-border-amber-strong shadow-sm";
  } else if (day.fastingDay) {
    cellClass += "bg-ramadan-amber/18 border border-ramadan-amber/30 glow-border-amber shadow-sm";
  } else {
    cellClass += "bg-card/50 border border-border/50";
  }

  // Determine accent color for the date number
  let dateColor = "text-foreground";
  if (day.isMuted) dateColor = "text-muted-foreground/40";
  else if (day.isDualEidCell || day.isEidIf30) dateColor = "text-ramadan-eid";
  else if (day.isFirstTarawih) dateColor = "text-ramadan-tarawih";
  else if (day.isQadrNight) dateColor = "text-ramadan-qadr";
  else if (day.isLastTen) dateColor = "text-ramadan-sunset";
  else if (day.fastingDay) dateColor = "text-ramadan-amber";

  return (
    <div className={cellClass} onClick={onClick} role="button" tabIndex={0}>
      {/* Weekday label */}
      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-0.5">
        {WEEKDAYS[day.dayOfWeek]}
      </span>

      {/* Large date number */}
      <span className={`text-2xl font-bold leading-tight ${dateColor}`}>
        {day.dayOfMonth}
      </span>

      {/* Icon indicator row — no text labels */}
      <div className="flex items-center gap-1 mt-1 min-h-[16px]">
        {day.isFirstTarawih && (
          <Moon className="h-3.5 w-3.5 text-ramadan-tarawih" />
        )}
        {day.isQadrNight && (
          <Moon className="h-3.5 w-3.5 text-ramadan-qadr" />
        )}
        {day.isDualEidCell && (
          <Star className="h-3.5 w-3.5 text-ramadan-eid" />
        )}
        {day.isEidIf30 && (
          <Star className="h-3.5 w-3.5 text-ramadan-eid" />
        )}
        {day.fastingDay && !day.isQadrNight && !day.isDualEidCell && !day.isFirstTarawih && (
          <span className={`text-[9px] font-semibold ${
            day.isLastTen ? 'text-ramadan-sunset' : 'text-ramadan-amber'
          }`}>
            {getOrdinal(day.fastingDay)}
          </span>
        )}
        {day.isQadrNight && day.fastingDay && (
          <span className="text-[9px] font-semibold text-ramadan-qadr">
            {getOrdinal(day.fastingDay)}
          </span>
        )}
      </div>
    </div>
  );
}
