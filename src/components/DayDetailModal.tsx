import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDay, getOrdinal } from "@/lib/ramadan-data";
import { fetchPrayerTimes, METHOD_NAME, type LocationData, type PrayerTimesData } from "@/lib/prayer-times";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface Props {
  day: CalendarDay | null;
  onClose: () => void;
  location: LocationData;
}

export function DayDetailModal({ day, onClose, location }: Props) {
  const [prayers, setPrayers] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!day || (day.isMuted && !day.isFirstTarawih)) {
      setPrayers(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPrayerTimes(day.date, location)
      .then((data) => {
        if (!cancelled) {
          setPrayers(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load prayer times. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [day, location]);

  if (!day) return null;

  const showPrayers = day.fastingDay || day.isFirstTarawih || day.isDualEidCell || day.isEidIf30;

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
              🌙 Odd Night (Laylatul Qadr — {getOrdinal(day.qadrNightNumber!)} Night, evening)
            </p>
          )}

          {day.isLastTen && !day.isQadrNight && (
            <p className="text-ramadan-sunset font-medium">🌙 Last 10 Nights</p>
          )}

          {day.isDualEidCell && (
            <div className="space-y-1 text-sm">
              <p className="text-ramadan-eid font-medium">🌙 Eid al-Fitr — if Ramadan is 29 days</p>
              <p className="text-ramadan-amber font-medium">or 30th Fast — if Ramadan is 30 days</p>
            </div>
          )}

          {day.isEidIf30 && (
            <p className="text-ramadan-eid font-medium">🌙 Eid al-Fitr — if Ramadan is 30 days</p>
          )}

          {showPrayers && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                Prayer Times — {location.city}, {location.state}
              </h4>

              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive py-2">{error}</p>
              )}

              {prayers && !loading && (
                <>
                  {/* Imsak */}
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-ramadan-amber/80 italic">Imsak</span>
                    <span className="text-ramadan-amber/80 italic">{prayers.imsak}</span>
                  </div>

                  {[
                    { label: "Fajr", value: prayers.fajr },
                    { label: "Sunrise", value: prayers.sunrise },
                    { label: "Dhuhr", value: prayers.dhuhr },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}

                  {/* Dual Asr */}
                  <div className="flex justify-between text-sm items-start">
                    <div>
                      <span className="font-medium">Asr (Standard)</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">Shafi'i, Maliki, Hanbali</p>
                    </div>
                    <span className="text-muted-foreground">{prayers.asr}</span>
                  </div>
                  <div className="flex justify-between text-sm items-start">
                    <div>
                      <span className="font-medium">Asr (Hanafi)</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">Hanafi madhab</p>
                    </div>
                    <span className="text-muted-foreground">{prayers.asrHanafi}</span>
                  </div>

                  {[
                    { label: "Maghrib", value: prayers.maghrib },
                    { label: "Isha", value: prayers.isha },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}

                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-ramadan-qadr">Last Third Begins</span>
                      <span className="text-ramadan-qadr">{prayers.lastThirdBegins}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                      Calculated as: Fajr − (Night Duration ÷ 3), where Night = Maghrib → Fajr
                    </p>
                  </div>
                </>
              )}

              <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/50">
                Prayer times calculated using {METHOD_NAME} via the AlAdhan API for {location.city}, {location.state}.
              </p>
            </div>
          )}

          {day.isMuted && !day.isFirstTarawih && (
            <p className="text-muted-foreground text-sm">This day is outside the fasting period.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
