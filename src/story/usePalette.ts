import { useMemo } from "react";
import { getLanguageColor } from "../utils/languages";

export interface Palette {
  primary: string;
  accent: string;
  deep: string;
  ink: string;
  paper: string;
  gradient: string;
}

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s: number;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360}, ${Math.max(0, Math.min(100, s))}%, ${Math.max(0, Math.min(100, l))}%)`;
}

// Deterministic placeholder palette derived from a string. Used while the
// real language data is still in flight so the loading state already feels
// personal — the gradient won't suddenly swap colors when data lands.
export function placeholderPalette(seed: string): Palette {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  const s = 55;
  const l = 60;
  return {
    primary: hsl(hue, s, l),
    accent: hsl(hue + 35, s + 5, l + 5),
    deep: hsl(hue, 45, 12),
    ink: "#fafafa",
    paper: "#06060a",
    gradient: `radial-gradient(ellipse at 30% 20%, ${hsl(hue, 55, 22)} 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, ${hsl(hue + 35, 55, 18)} 0%, transparent 55%), #06060a`,
  };
}

export function usePalette(primaryLanguage: string | null): Palette {
  return useMemo(() => {
    const base = primaryLanguage ? getLanguageColor(primaryLanguage) : "#8b5cf6";
    const [h, s, l] = hexToHsl(base);

    return {
      primary: hsl(h, Math.max(s, 60), Math.min(Math.max(l, 55), 70)),
      accent: hsl(h + 35, Math.max(s, 65), Math.min(Math.max(l, 60), 72)),
      deep: hsl(h, Math.max(s, 50), 12),
      ink: "#fafafa",
      paper: "#06060a",
      gradient: `radial-gradient(ellipse at 30% 20%, ${hsl(h, Math.max(s, 60), 22)} 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, ${hsl(h + 35, Math.max(s, 60), 18)} 0%, transparent 55%), #06060a`,
    };
  }, [primaryLanguage]);
}
