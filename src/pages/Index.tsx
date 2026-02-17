import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RamadanCalendar } from "@/components/RamadanCalendar";
import { DayDetailModal } from "@/components/DayDetailModal";
import { LocationSelector } from "@/components/LocationSelector";
import { ExportConfirmModal } from "@/components/ExportConfirmModal";
import {
  CalendarDay,
  generateCalendarDays,
  generateICS,
  type StartDate,
} from "@/lib/ramadan-data";
import { type LocationData, getDefaultLocation } from "@/lib/prayer-times";
import { Moon, Star, Download, ExternalLink, Heart, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const STORAGE_KEY_LOCATION = 'ramadan2026_location';
const STORAGE_KEY_START = 'ramadan2026_start';

function loadSavedLocation(): LocationData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (saved) return JSON.parse(saved);
  } catch {}
  return getDefaultLocation();
}

function loadSavedStart(): StartDate {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_START);
    if (saved === 'feb18' || saved === 'feb19') return saved;
  } catch {}
  return 'feb18';
}

const Index = () => {
  const [startOption, setStartOption] = useState<StartDate>(loadSavedStart);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [location, setLocation] = useState<LocationData>(loadSavedLocation);
  const [exportModal, setExportModal] = useState<{ open: boolean; type: "google" | "ics" }>({ open: false, type: "ics" });
  const [exporting, setExporting] = useState(false);

  const handleLocationChange = (loc: LocationData) => {
    setLocation(loc);
    try { localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(loc)); } catch {}
  };

  const handleStartChange = (opt: StartDate) => {
    setStartOption(opt);
    try { localStorage.setItem(STORAGE_KEY_START, opt); } catch {}
  };

  const days = generateCalendarDays(startOption);

  const handleExportConfirm = async () => {
    setExporting(true);
    try {
      const ics = await generateICS(startOption, location);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });

      if (exportModal.type === "google") {
        // Download the file first, then open Google Calendar import
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ramadan-2026.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Open Google Calendar import page
        window.open('https://calendar.google.com/calendar/r/settings/export', '_blank');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ramadan-2026.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
      setExportModal({ open: false, type: exportModal.type });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

      {/* ─── HERO ─── */}
      <header className="relative overflow-hidden py-12 md:py-16 flex flex-col items-center justify-center text-center px-4">
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
          <p className="font-display text-lg sm:text-xl md:text-2xl text-muted-foreground text-glow mt-2 mb-4">
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
      <LocationSelector location={location} onLocationChange={handleLocationChange} />

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
            variant={startOption === 'feb18' ? 'default' : 'outline'}
            onClick={() => handleStartChange('feb18')}
            className={startOption === 'feb18' ? 'glow-border-amber' : ''}
          >
            February 18 — Astronomical
          </Button>
          <Button
            variant={startOption === 'feb19' ? 'default' : 'outline'}
            onClick={() => handleStartChange('feb19')}
            className={startOption === 'feb19' ? 'glow-border-amber' : ''}
          >
            February 19 — Moon Sighting
          </Button>
        </div>
      </section>

      {/* ─── ACTIVE LOCATION LABEL ─── */}
      <p className="text-center text-sm text-muted-foreground mb-2">
        Prayer times for:{' '}
        <span className="font-semibold text-foreground">
          {location.city}, {location.state}{location.zip ? ` ${location.zip}` : ''}
        </span>
      </p>

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
        <p className="text-muted-foreground text-xs sm:text-sm mt-4 leading-relaxed text-center max-w-2xl mx-auto">
          <strong className="text-foreground not-italic">Note:</strong> In Islam, the night begins before the day. This means the "odd night" comes before the corresponding fast day. For example, after Maghrib on the 20th fast, the 21st night begins and continues until Fajr, after which the 21st fast day starts.
        </p>
      </section>

      {/* ─── ADD TO CALENDAR ─── */}
      <section className="max-w-md mx-auto px-4 py-8 text-center space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => setExportModal({ open: true, type: "google" })}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Add to Google Calendar
          </Button>
          <Button variant="outline" onClick={() => setExportModal({ open: true, type: "ics" })}>
            <Download className="mr-2 h-4 w-4" />
            Download for Apple Calendar
          </Button>
        </div>
         <p className="text-xs text-muted-foreground">
           The .ics file works with Apple Calendar, Outlook, Google Calendar, and other calendar apps.
         </p>
         <Collapsible>
           <CollapsibleTrigger className="inline-flex items-center gap-1 text-xs font-medium text-ramadan-amber hover:text-ramadan-amber/80 transition-colors mt-2 group">
             How to Add to Google Calendar (Step-by-Step)
             <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
           </CollapsibleTrigger>
           <CollapsibleContent className="mt-3">
             <ol className="text-left text-xs sm:text-sm text-muted-foreground space-y-2 list-decimal list-inside bg-muted/30 rounded-lg p-4 border border-border">
               <li>Click <strong className="text-foreground">"Generate & Open Google Calendar"</strong>.</li>
               <li>The ICS file will automatically download to your device.</li>
               <li>You will be redirected to the Google Calendar import page.</li>
               <li>Click <strong className="text-foreground">"Select file from your computer"</strong>.</li>
               <li>Choose the ICS file you just downloaded and click <strong className="text-foreground">"Import"</strong> to add all Ramadan events at once.</li>
             </ol>
           </CollapsibleContent>
         </Collapsible>
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
        <p className="text-sm text-muted-foreground">
          For the Muslim community in the USA
        </p>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            With Love,
          </p>
          <a
            href="https://www.linkedin.com/in/ahmednusrat/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground hover:text-ramadan-amber transition-colors"
          >
            Nusrat Ahmed
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Calendar inspiration from{' '}
          <a
            href="https://www.linkedin.com/in/spatial-uzair/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-ramadan-amber transition-colors"
          >
            Uzair Khan's
          </a>{' '}
          UK calendar
        </p>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            © 2026 Ramadan Calendar USA. All rights reserved. Moon sighting dates may vary by region.
            This calendar includes both astronomical calculations and traditional sighting estimates.
            Please confirm with your local community or Islamic authority.
          </p>
        </div>
      </footer>

      {/* ─── DAY DETAIL MODAL ─── */}
      <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} location={location} />

      {/* ─── EXPORT CONFIRM MODAL ─── */}
      <ExportConfirmModal
        open={exportModal.open}
        onClose={() => setExportModal({ open: false, type: "ics" })}
        onConfirm={handleExportConfirm}
        location={location}
        startOption={startOption}
        exportType={exportModal.type}
        loading={exporting}
      />
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
