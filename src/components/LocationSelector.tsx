import { useState, useMemo } from "react";
import { MapPin, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type LocationData, US_CITIES, getDefaultLocation } from "@/lib/prayer-times";

interface Props {
  location: LocationData;
  onLocationChange: (location: LocationData) => void;
}

export function LocationSelector({ location, onLocationChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [zip, setZip] = useState("");
  const [zipError, setZipError] = useState("");
  const [loadingZip, setLoadingZip] = useState(false);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return US_CITIES;
    const q = search.toLowerCase();
    return US_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
    );
  }, [search]);

  const handleZipSubmit = async () => {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setZipError("Enter a valid 5-digit U.S. ZIP code");
      return;
    }
    setZipError("");
    setLoadingZip(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${trimmed}`);
      if (!res.ok) throw new Error("Invalid ZIP");
      const data = await res.json();
      const place = data.places?.[0];
      if (!place) throw new Error("No results");

      const lat = parseFloat(place.latitude);
      const lng = parseFloat(place.longitude);
      const state = place["state abbreviation"] || place.state || "";
      const city = place["place name"] || "";

      // Determine timezone from nearest city or fallback
      let tz = "America/New_York";
      let minDist = Infinity;
      for (const c of US_CITIES) {
        const dist = Math.hypot(c.lat - lat, c.lng - lng);
        if (dist < minDist) {
          minDist = dist;
          tz = c.tz;
        }
      }

      onLocationChange({
        city,
        state,
        latitude: lat,
        longitude: lng,
        timezone: tz,
        zip: trimmed,
      });
    } catch {
      setZipError("Could not find that ZIP code. Please try again.");
    } finally {
      setLoadingZip(false);
    }
  };

  const selectCity = (c: (typeof US_CITIES)[number]) => {
    onLocationChange({
      city: c.city,
      state: c.state,
      latitude: c.lat,
      longitude: c.lng,
      timezone: c.tz,
    });
    setOpen(false);
    setSearch("");
    setZip("");
    setZipError("");
  };

  return (
    <section className="max-w-2xl mx-auto px-4 pt-0 pb-4 text-center">
      <h2 className="font-display text-lg sm:text-xl font-bold mb-1 flex items-center justify-center gap-2">
        <MapPin className="h-4 w-4 text-ramadan-amber" />
        Your Location
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Select a city or enter your ZIP code for precise prayer times.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {/* City Dropdown */}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {location.city}, {location.state}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="center">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search city or state..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredCities.length === 0 && (
                <p className="text-sm text-muted-foreground p-3 text-center">No cities found</p>
              )}
              {filteredCities.map((c) => (
                <button
                  key={`${c.city}-${c.state}`}
                  onClick={() => selectCity(c)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted/50 ${
                    c.city === location.city && c.state === location.state
                      ? "bg-ramadan-amber/10 text-ramadan-amber font-medium"
                      : "text-foreground"
                  }`}
                >
                  {c.city}, {c.state}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* OR Divider */}
        <span className="text-lg tracking-wide text-muted-foreground/70 select-none px-1">OR</span>

        {/* ZIP Code Input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter ZIP Code"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
              setZipError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleZipSubmit();
            }}
            className="w-[140px] h-9 text-sm"
            maxLength={5}
            inputMode="numeric"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleZipSubmit}
            disabled={loadingZip}
            className="text-xs"
          >
            {loadingZip ? "Looking up..." : "Go"}
          </Button>
        </div>
      </div>

      {zipError && (
        <p className="text-destructive text-xs mt-2">{zipError}</p>
      )}
    </section>
  );
}
