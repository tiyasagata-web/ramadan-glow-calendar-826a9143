import { useRef, useState, useEffect, useCallback } from "react";
import { CalendarDay, getOrdinal, formatEidLabel, getEidDate29, getEidDate30, type StartDate } from "@/lib/ramadan-data";
import { Moon, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Group days into sections of 9 (3x3 grid)
  const sections: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 9) {
    sections.push(days.slice(i, i + 9));
  }

  // Determine month label per section
  const sectionLabels = sections.map((section) => {
    const firstMonth = section[0].month;
    const lastMonth = section[section.length - 1].month;
    return firstMonth === lastMonth
      ? `${MONTH_NAMES[firstMonth]} 2026`
      : `${MONTH_NAMES[firstMonth]} → ${MONTH_NAMES[lastMonth]} 2026`;
  });

  // Observe which section is visible
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(Math.min(index, sections.length - 1));
  }, [sections.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section className="max-w-md mx-auto pb-12">
      {/* Dynamic month title */}
      <div className="px-4 mb-1">
        <h3 className="font-display text-xl font-bold month-gradient transition-all duration-300">
          {sectionLabels[activeIndex]}
        </h3>
        <p className="text-sm text-muted-foreground font-medium mt-1 mb-4">
          Swipe to browse · Tap any day for prayer times
        </p>
      </div>

      {/* Horizontal swipe container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {sections.map((section, si) => (
          <div
            key={si}
            className="flex-none w-full snap-center px-4"
          >
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
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-4 px-4">
        {sections.map((_, i) => (
          <button
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-6 h-2 bg-ramadan-amber'
                : 'w-2 h-2 bg-muted-foreground/25'
            }`}
            onClick={() => {
              scrollRef.current?.scrollTo({ left: i * (scrollRef.current?.clientWidth || 0), behavior: 'smooth' });
            }}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      {/* Dual Eid note */}
      <div className="mx-4 mt-6 text-center text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-4 border border-border">
        <p>Eid al-Fitr if 29 days: <strong className="text-ramadan-eid">{formatEidLabel(eid29)}</strong></p>
        <p>Eid al-Fitr if 30 days: <strong className="text-ramadan-eid">{formatEidLabel(eid30)}</strong></p>
        <p className="mt-2 text-xs">Exact date depends on local moon sighting.</p>
      </div>
    </section>
  );
}

function MobileCell({ day, eid29, eid30, onClick }: { day: CalendarDay; eid29: Date; eid30: Date; onClick: () => void }) {
  // Base styling
  let cellClass = "relative rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center overflow-hidden active:scale-[0.97] ";
  cellClass += "min-h-[110px] p-2.5 ";

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

  return (
    <div className={cellClass} onClick={onClick} role="button" tabIndex={0}>
      {/* Weekday — tertiary */}
      <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
        {WEEKDAYS[day.dayOfWeek]}
      </span>

      {/* Primary content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 my-1">
        {/* Fasting days: "Xth Fast" as primary */}
        {day.fastingDay && !day.isDualEidCell && (
          <>
            <span className={`text-base font-bold leading-tight text-center ${
              day.isQadrNight ? 'text-ramadan-qadr' :
              day.isLastTen ? 'text-ramadan-sunset' :
              'text-ramadan-amber'
            }`}>
              {getOrdinal(day.fastingDay)}
            </span>
            <span className={`text-[10px] font-semibold tracking-wide uppercase ${
              day.isQadrNight ? 'text-ramadan-qadr/80' :
              day.isLastTen ? 'text-ramadan-sunset/80' :
              'text-ramadan-amber/80'
            }`}>
              Fast
            </span>
          </>
        )}

        {/* First Tarawih */}
        {day.isFirstTarawih && (
          <>
            <Moon className="h-4 w-4 text-ramadan-tarawih mb-0.5" />
            <span className="text-[10px] font-semibold text-ramadan-tarawih leading-tight text-center">
              Tarawih
            </span>
          </>
        )}

        {/* Dual Eid cell */}
        {day.isDualEidCell && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-ramadan-eid" />
              <span className="text-[10px] font-bold text-ramadan-eid">Eid</span>
            </div>
            <span className="text-[8px] text-ramadan-eid/70">if 29</span>
            <div className="w-6 h-px bg-border/60 my-0.5" />
            <span className="text-[10px] font-semibold text-ramadan-amber">30th</span>
            <span className="text-[8px] text-muted-foreground">if 30</span>
          </div>
        )}

        {/* Eid if 30 */}
        {day.isEidIf30 && (
          <>
            <Star className="h-4 w-4 text-ramadan-eid mb-0.5" />
            <span className="text-xs font-bold text-ramadan-eid leading-tight text-center">
              Eid al-Fitr
            </span>
            <span className="text-[8px] text-ramadan-eid/70">if 30 days</span>
          </>
        )}

        {/* Muted (non-fasting, non-special) */}
        {day.isMuted && (
          <span className="text-lg font-medium text-muted-foreground/30">
            {day.dayOfMonth}
          </span>
        )}
      </div>

      {/* Secondary: date number (for fasting & special days) */}
      {!day.isMuted && (
        <span className="text-[10px] text-muted-foreground/50 font-medium">
          {day.dayOfMonth} {MONTH_NAMES[day.month].slice(0, 3)}
        </span>
      )}

      {/* Tertiary indicators — compact badges */}
      {day.isQadrNight && day.fastingDay && (
        <div className="absolute top-1 right-1">
          <Moon className="h-3 w-3 text-ramadan-qadr" />
        </div>
      )}
      {day.isLastTen && !day.isQadrNight && day.fastingDay && (
        <div className="absolute top-1 right-1">
          <span className="text-[7px] font-bold text-ramadan-sunset/70">L10</span>
        </div>
      )}
    </div>
  );
}
