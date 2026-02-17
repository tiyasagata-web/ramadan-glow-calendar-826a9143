import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type LocationData } from "@/lib/prayer-times";
import { type StartDate, getEidDate29, getEidDate30, formatShortDate } from "@/lib/ramadan-data";
import { MapPin, Clock, Moon, Calendar, Download } from "lucide-react";

interface ExportConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  location: LocationData;
  startOption: StartDate;
  exportType: "google" | "ics";
  loading?: boolean;
}

export function ExportConfirmModal({
  open,
  onClose,
  onConfirm,
  location,
  startOption,
  exportType,
  loading,
}: ExportConfirmModalProps) {
  const startDate = startOption === "feb18" ? "February 18, 2026" : "February 19, 2026";
  const startMethod = startOption === "feb18" ? "Astronomical Calculation" : "Moon Sighting Estimate";
  const tarawihDate = startOption === "feb18" ? "February 17, 2026" : "February 18, 2026";
  const eid29 = getEidDate29(startOption);
  const eid30 = getEidDate30(startOption);

  const rows = [
    { icon: MapPin, label: "Location", value: `${location.city}, ${location.state}${location.zip ? ` ${location.zip}` : ""}` },
    { icon: Clock, label: "Timezone", value: location.timezone.replace(/_/g, " ") },
    { icon: Moon, label: "Start Method", value: `${startMethod} (${startDate})` },
    { icon: Calendar, label: "Period", value: `First Tarawih ${tarawihDate} → Eid ${formatShortDate(eid29)} or ${formatShortDate(eid30)}` },
    { icon: Calendar, label: "Fasting Days", value: "29 days (+ conditional 30th)" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-ramadan-amber" />
            Confirm Calendar Export
          </DialogTitle>
          <DialogDescription>
            {exportType === "google"
              ? "Review your settings. The calendar file will be generated and Google Calendar's import page will open automatically."
              : "Review your settings before downloading the .ics file."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <r.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-foreground">{r.label}:</span>{" "}
                <span className="text-muted-foreground">{r.value}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          The file will include all daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha), First Tarawih, Last 10 Nights, Qadr nights, and Eid al-Fitr.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading
              ? "Generating…"
              : exportType === "google"
                ? "Generate & Open Google Calendar"
                : "Download .ics File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
