import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDay, getPrayerTimes, getOrdinal, formatShortDate } from "@/lib/ramadan-data";
import { format } from "date-fns";

interface Props {
  day: CalendarDay | null;
  onClose: () => void;
}

export function DayDetailModal({ day, onClose }: Props) {
  if (!day) return null;

  const prayers = getPrayerTimes(day.date);
  const showPrayers = day.fastingDay || day.isFirstTarawih;

  return (
    <Dialog open={!!day} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {format(day.date, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {day.fastingDay && (
            <p className="text-lg font-semibold text-ramadan-amber font-display">
              {getOrdinal(day.fastingDay)} Fast
            </p>
          )}

          {day.isFirstTarawih && (
            <p className="text-ramadan-tarawih font-medium">
              🌙 First Tarawih Night — Evening
            </p>
          )}

          {day.isQadrNight && (
            <p className="text-ramadan-qadr font-medium">
              ✨ Odd Night (Laylatul Qadr — {getOrdinal(day.qadrNightNumber!)} Night, evening)
            </p>
          )}

          {day.isLastTen && !day.isQadrNight && (
            <p className="text-ramadan-sunset font-medium">🔥 Last 10 Nights</p>
          )}

          {day.isDualEidCell && (
            <div className="space-y-1 text-sm">
              <p className="text-ramadan-eid font-medium">☪ Eid al-Fitr — if Ramadan is 29 days</p>
              <p className="text-ramadan-amber font-medium">or 30th Fast — if Ramadan is 30 days</p>
            </div>
          )}

          {day.isEidIf30 && (
            <p className="text-ramadan-eid font-medium">☪ Eid al-Fitr — if Ramadan is 30 days</p>
          )}

          {showPrayers && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                Prayer Times (NYC area, approximate)
              </h4>
              {Object.entries(prayers).map(([name, time]) => (
                <div key={name} className="flex justify-between text-sm">
                  <span className="capitalize font-medium">{name}</span>
                  <span className="text-muted-foreground">{time}</span>
                </div>
              ))}
            </div>
          )}

          {day.isMuted && (
            <p className="text-muted-foreground text-sm">This day is outside the fasting period.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
