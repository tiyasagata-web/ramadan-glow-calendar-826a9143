import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RamadanCalendar } from "@/components/RamadanCalendar";
import { DayDetailModal } from "@/components/DayDetailModal";
import { LocationSelector } from "@/components/LocationSelector";
import {
  CalendarDay,
  generateCalendarDays,
  generateICS,
  getGoogleCalendarUrl,
  type StartDate,
} from "@/lib/ramadan-data";
import { type LocationData, getDefaultLocation } from "@/lib/prayer-times";
import { Moon, Star, Download, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [startOption, setStartOption] = useState<StartDate>('feb17');
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [location, setLocation] = useState<LocationData>(getDefaultLocation);

  const days = generateCalendarDays(startOption);

  const handleDownloadICS = () => {
    const ics = generateICS(startOption);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ramadan-2026.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

      {/* ─── HERO ─── */}
      <header className="relative overflow-hidden py-20 md:py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 hero-glow" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-5 flex items-center justify-center gap-3 text-ramadan-amber animate-float">
            <Star className="h-4 w-4 opacity-60" />
            <Moon className="h-7 w-7" />
            <Star className="h-4 w-4 opacity-60" />
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-glow-strong tracking-tight">
            Ramadan 2026
          </h1>
          <p className="font-display text-lg sm:text-xl md:text-2xl text-muted-foreground text-glow mt-2 mb-8">
            United States Calendar
          </p>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base max-w-xl mx-auto">
            Ramadan is a sacred month of fasting, prayer, reflection, and community.
            This calendar helps you track the blessed days ahead — from the first Tarawih
            to the joyous celebration of Eid al-Fitr.
          </p>
        </div>
      </header>

      {/* ─── LOCATION SELECTOR (comes first) ─── */}
      <LocationSelector location={location} onLocationChange={setLocation} />

      {/* ─── START DATE SELECTOR ─── */}
      <section className="max-w-2xl mx-auto px-4 pt-2 pb-6 text-center">
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-2">
          Select Ramadan Start Date
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Choose based on your local moon sighting tradition.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant={startOption === 'feb17' ? 'default' : 'outline'}
            onClick={() => setStartOption('feb17')}
            className={startOption === 'feb17' ? 'glow-border-amber' : ''}
          >
            February 17 — Astronomical
          </Button>
          <Button
            variant={startOption === 'feb18' ? 'default' : 'outline'}
            onClick={() => setStartOption('feb18')}
            className={startOption === 'feb18' ? 'glow-border-amber' : ''}
          >
            February 18 — Moon Sighting
          </Button>
        </div>
      </section>

      {/* ─── HELPER TEXT ─── */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <p className="text-center text-base sm:text-lg text-muted-foreground font-medium">
          Click on any day to view full prayer times.
        </p>
      </div>

      {/* ─── CALENDAR ─── */}
      <RamadanCalendar days={days} startOption={startOption} onDayClick={setSelectedDay} />

      {/* ─── LEGEND ─── */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <LegendItem color="bg-ramadan-amber/20 border-ramadan-amber/30 glow-border-amber" label="Fasting Day" />
          <LegendItem color="bg-ramadan-sunset/20 border-ramadan-sunset/35 glow-border-amber-strong" label="Last 10 Nights" />
          <LegendItem color="bg-ramadan-qadr/15 border-ramadan-qadr/30 glow-border-qadr" label="Odd Night (Qadr)" />
          <LegendItem color="bg-ramadan-eid/15 border-ramadan-eid/30 glow-border-eid" label="Eid al-Fitr" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mt-4 leading-relaxed italic text-center max-w-2xl mx-auto">
          "Laylatul Qadr, the Night of Power, is a deeply sacred night in the last 10 nights of
          Ramadan when the Qur'an was first revealed. Many Muslims seek it on the odd nights,
          dedicating the evening to prayer, reflection, and worship."
        </p>
      </section>

      {/* ─── ADD TO CALENDAR ─── */}
      <section className="max-w-md mx-auto px-4 py-8 text-center space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <a href={getGoogleCalendarUrl(startOption)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Add to Google Calendar
            </a>
          </Button>
          <Button variant="outline" onClick={handleDownloadICS}>
            <Download className="mr-2 h-4 w-4" />
            Download for Apple Calendar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The .ics file works with Apple Calendar, Outlook, and other calendar apps.
        </p>
      </section>

      {/* ─── EDUCATIONAL ─── */}
      <section className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
            <Moon className="h-5 w-5 text-ramadan-qadr" />
            The Last 10 Nights &amp; Laylatul Qadr
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              The last ten nights of Ramadan hold immense spiritual significance. Muslims
              increase their worship, seeking closeness to Allah through extra prayers,
              recitation of the Qur'an, and reflection.
            </p>
            <p>
              <strong className="text-foreground">Laylatul Qadr (the Night of Power)</strong> is
              described in the Qur'an as "better than a thousand months." It is the night the
              Qur'an was first revealed to Prophet Muhammad ﷺ.
            </p>
            <p>
              It occurs on one of the odd nights — the 21st, 23rd, 25th, 27th, or 29th — which
              correspond to the evenings following fasting days 20, 22, 24, 26, and 28.
              Many dedicate these evenings entirely to worship.
            </p>
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY PARTNER ─── */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <a
          href="https://hijabifriendly.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card rounded-2xl p-6 border border-ramadan-teal/25 hover:border-ramadan-teal/50 transition-all duration-300 hover:shadow-lg group"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 rounded-full bg-ramadan-teal/15 flex items-center justify-center text-ramadan-teal">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold group-hover:text-ramadan-teal transition-colors">
                Hijabi-Friendly Hair Salon Directory in NYC
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Finding a Hijab-Friendly Salon in NYC Shouldn't Be This Hard
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-ramadan-teal mt-2 font-medium">
                Visit hijabifriendly.com <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        </a>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          ⚪ Moon sighting dates may vary by region. This calendar provides both astronomical
          calculation and traditional sighting options. Always confirm with your local community
          or Islamic authority.
        </p>

        <p className="font-amiri text-lg text-foreground/80">
          May this Ramadan bring you peace, forgiveness, and barakah.
        </p>

        <div className="pt-4 border-t border-border space-y-1">
          <p className="text-sm text-muted-foreground">
            Calendar concept by{' '}
            <a
              href="https://www.linkedin.com/in/spatial-uzair/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-ramadan-amber transition-colors"
            >
              UZAIR KHAN
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Made with care for the Muslim community in the USA
          </p>
        </div>
      </footer>

      {/* ─── DAY DETAIL MODAL ─── */}
      <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} location={location} />
    </div>
  );
};

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-5 w-5 rounded-md border ${color} shrink-0`} />
      <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default Index;
