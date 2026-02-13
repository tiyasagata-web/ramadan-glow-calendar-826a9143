import { useState, useMemo } from "react";
import { MapPin, Navigation, ChevronDown, Search } from "lucide-react";
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
  const [detecting, setDetecting] = useState(false);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return US_CITIES;
    const q = search.toLowerCase();
    return US_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
    );
  }, [search]);

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );

      const { latitude, longitude } = pos.coords;

      // Find nearest US city
      let nearest = US_CITIES[0];
      let minDist = Infinity;
      for (const c of US_CITIES) {
        const dist = Math.hypot(c.lat - latitude, c.lng - longitude);
        if (dist < minDist) {
          minDist = dist;
          nearest = c;
        }
      }

      onLocationChange({
        city: nearest.city,
        state: nearest.state,
        latitude: nearest.lat,
        longitude: nearest.lng,
        timezone: nearest.tz,
      });
    } catch {
      // Fallback to default
      onLocationChange(getDefaultLocation());
    } finally {
      setDetecting(false);
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
  };

  return (
    <section className="max-w-2xl mx-auto px-4 pt-0 pb-4 text-center">
      <h2 className="font-display text-lg sm:text-xl font-bold mb-1 flex items-center justify-center gap-2">
        <MapPin className="h-4 w-4 text-ramadan-amber" />
        Your Location
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Prayer times are calculated for your selected city.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
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

        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="text-xs"
        >
          <Navigation className="h-3.5 w-3.5 mr-1.5" />
          {detecting ? "Detecting..." : "Auto-detect"}
        </Button>
      </div>
    </section>
  );
}
