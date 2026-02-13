import { CalendarDay, getOrdinal, formatShortDate, formatEidLabel, getEidDate29, getEidDate30, type StartDate } from "@/lib/ramadan-data";
import { Moon, Star } from "lucide-react";

interface Props {
  days: CalendarDay[];
  startOption: StartDate;
  onDayClick: (day: CalendarDay) => void;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RamadanCalendar({ days, startOption, onDayClick }: Props) {
  // Group days into weeks of 7
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const eid29 = getEidDate29(startOption);
  const eid30 = getEidDate30(startOption);

  // Detect month transition for inline label
  const monthTransitionWeek = weeks.findIndex((week, wi) =>
    wi > 0 && week[0].month !== weeks[wi - 1][0].month
  );

  return (
    <section className="max-w-4xl mx-auto px-4 pb-12">
      {/* Inline month flow label */}
      <div className="flex items-center gap-3 mb-1">
        <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold month-gradient">
          February
        </h3>
        <span className="text-muted-foreground text-lg">→</span>
        <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold month-gradient">
          March 2026
        </h3>
      </div>
      <p className="text-center text-base sm:text-lg text-muted-foreground font-medium mb-4">
        Click on any day to view full prayer times.
      </p>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi}>
          {wi === monthTransitionWeek && (
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-ramadan-amber/30 to-transparent" />
              <span className="text-xs text-muted-foreground font-medium px-2">March</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-ramadan-amber/30 to-transparent" />
            </div>
          )}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            {week.map((day, di) => (
              <CalendarCell key={di} day={day} eid29={eid29} eid30={eid30} onClick={() => onDayClick(day)} />
            ))}
          </div>
        </div>
      ))}

      {/* Dual Eid note */}
      <div className="mt-6 text-center text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-4 border border-border">
        <p>Eid al-Fitr if 29 days: <strong className="text-ramadan-eid">{formatEidLabel(eid29)}</strong></p>
        <p>Eid al-Fitr if 30 days: <strong className="text-ramadan-eid">{formatEidLabel(eid30)}</strong></p>
        <p className="mt-2 text-xs">Exact date depends on local moon sighting.</p>
      </div>
    </section>
  );
}

function CalendarCell({ day, eid29, eid30, onClick }: { day: CalendarDay; eid29: Date; eid30: Date; onClick: () => void }) {
  let cellClass = "relative rounded-lg cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden ";
  cellClass += "min-h-[72px] sm:min-h-[90px] md:min-h-[105px] p-1.5 sm:p-2 md:p-2.5 ";

  if (day.isMuted) {
    cellClass += "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50";
  } else if (day.isDualEidCell) {
    cellClass += "bg-gradient-to-b from-ramadan-eid/20 to-ramadan-amber/15 border border-ramadan-eid/30 hover:border-ramadan-eid/50";
  } else if (day.isEidIf30) {
    cellClass += "bg-ramadan-eid/15 border border-ramadan-eid/30 glow-border-eid hover:bg-ramadan-eid/25";
  } else if (day.isFirstTarawih) {
    cellClass += "bg-ramadan-tarawih/12 border border-ramadan-tarawih/25 glow-border-tarawih hover:bg-ramadan-tarawih/20";
  } else if (day.isQadrNight) {
    cellClass += "bg-ramadan-qadr/20 border border-ramadan-qadr/40 glow-border-qadr hover:bg-ramadan-qadr/30";
  } else if (day.isLastTen) {
    cellClass += "bg-ramadan-sunset/25 border border-ramadan-sunset/45 glow-border-amber-strong hover:bg-ramadan-sunset/35";
  } else if (day.fastingDay) {
    cellClass += "bg-ramadan-amber/18 border border-ramadan-amber/30 glow-border-amber hover:bg-ramadan-amber/25";
  }

  return (
    <div className={cellClass} onClick={onClick} role="button" tabIndex={0} aria-label={getAriaLabel(day)}>
      {/* Date & Qadr icon */}
      <div className="flex items-start justify-between">
        <span className={`text-[10px] sm:text-xs ${day.isMuted ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
          {formatShortDate(day.date)}
        </span>
        {day.isQadrNight && (
          <div className="flex flex-col items-center gap-0">
            <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ramadan-qadr" />
            <span className="text-[6px] sm:text-[7px] font-medium text-ramadan-qadr/80 leading-tight">Laylatul</span>
            <span className="text-[6px] sm:text-[7px] font-medium text-ramadan-qadr/80 leading-tight">Qadr</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center gap-0.5">
        {day.isFirstTarawih && (
          <>
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-ramadan-tarawih" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-ramadan-tarawih leading-tight">
              First Tarawih
            </span>
            <span className="text-[8px] sm:text-[9px] text-muted-foreground">Evening</span>
          </>
        )}

        {day.fastingDay && (
          <>
            <span className={`text-xs sm:text-sm font-semibold leading-tight ${
              day.isQadrNight ? 'text-ramadan-qadr' :
              day.isLastTen ? 'text-ramadan-sunset' :
              'text-ramadan-amber'
            }`}>
              {getOrdinal(day.fastingDay)} Fast
            </span>
          </>
        )}

        {day.isDualEidCell && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-0.5">
              <Star className="h-2.5 w-2.5 text-ramadan-eid" />
              <span className="text-[9px] sm:text-[10px] font-semibold text-ramadan-eid leading-tight">Eid</span>
            </div>
            <span className="text-[7px] sm:text-[8px] text-ramadan-eid/70">if 29 days</span>
            <div className="border-t border-border/50 pt-0.5 mt-0.5">
              <span className="text-[9px] sm:text-[10px] font-medium text-ramadan-amber leading-tight">30th Fast</span>
              <span className="text-[7px] sm:text-[8px] text-muted-foreground block">if 30 days</span>
            </div>
          </div>
        )}

        {day.isEidIf30 && (
          <>
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-ramadan-eid" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-ramadan-eid leading-tight">
              Eid al-Fitr
            </span>
            <span className="text-[7px] sm:text-[8px] text-ramadan-eid/70">if 30 days</span>
          </>
        )}

        {day.isMuted && (
          <span className="text-[10px] sm:text-xs text-muted-foreground/30">{day.dayOfMonth}</span>
        )}
      </div>
    </div>
  );
}

function getAriaLabel(day: CalendarDay): string {
  if (day.fastingDay) return `${getOrdinal(day.fastingDay)} Fast, ${formatShortDate(day.date)}`;
  if (day.isFirstTarawih) return `First Tarawih Night, ${formatShortDate(day.date)}`;
  if (day.isDualEidCell) return `Eid al-Fitr if 29 days or 30th Fast, ${formatShortDate(day.date)}`;
  if (day.isEidIf30) return `Eid al-Fitr if 30 days, ${formatShortDate(day.date)}`;
  return formatShortDate(day.date);
}
