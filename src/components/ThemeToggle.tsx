import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed top-4 right-4 z-50 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-lg"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5 text-ramadan-glow" /> : <Moon className="h-5 w-5 text-ramadan-night" />}
    </Button>
  );
}
