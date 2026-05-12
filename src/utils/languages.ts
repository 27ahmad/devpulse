// Language color map for DevPulse. Mostly mirrors the GitHub Linguist
// palette — but a handful of canonical colors are intentionally swapped
// because Linguist's choices (e.g. C = #555555, Lua = #000080, CSS =
// #563d7c) read as muddy/gray on a dark background. The replacements stay
// in the same color family so they're still visually recognizable.
export const LANGUAGE_COLORS: Record<string, string> = {
  // ── Mainstream ──
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#4584b6",
  "Jupyter Notebook": "#DA5B0B",
  Java: "#e76f00",
  Kotlin: "#A97BFF",
  Scala: "#dc322f",
  Groovy: "#4298b8",
  Clojure: "#db5855",
  ClojureScript: "#db5855",

  // ── Systems ──
  C: "#5c8dbc",          // canon: #555555 (gray) — boosted
  "C++": "#f34b7d",
  "C#": "#5cb85c",       // canon: #178600 (dark) — boosted
  "Objective-C": "#438eff",
  "Objective-C++": "#6866fb",
  Go: "#00ADD8",
  Rust: "#dea584",
  Zig: "#ec915c",
  Nim: "#ffc200",
  V: "#4f87c4",
  D: "#ba595e",
  Crystal: "#bbbbbb",    // canon: #000100 (near-black) — boosted
  Ada: "#02f88c",
  Fortran: "#7d6bff",    // canon: #4d41b1 — slightly brighter
  Assembly: "#a4856a",   // canon: #6E4C13 — brighter
  WebAssembly: "#7a89c5",

  // ── Mobile ──
  Swift: "#F05138",
  Dart: "#00B4AB",

  // ── Web / scripting ──
  Ruby: "#e53935",       // canon: #701516 (very dark) — boosted
  PHP: "#7d8ad1",        // canon: #4F5D95 — lifted
  Perl: "#0298c3",
  Lua: "#3679b3",        // canon: #000080 (near-black) — boosted
  CoffeeScript: "#6a8eb5",
  HTML: "#e34c26",
  CSS: "#a370ed",        // canon: #563d7c (very dark) — boosted
  SCSS: "#c6538c",
  Sass: "#c6538c",
  Less: "#5b8db5",       // canon: #1d365d (very dark) — boosted
  Stylus: "#ff6347",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5d01",
  Elm: "#60B5CC",
  PureScript: "#a78bfa",

  // ── Functional ──
  Haskell: "#a497d1",    // canon: #5e5086 — lifted
  Elixir: "#b399d4",     // canon: #6e4a7e — lifted
  Erlang: "#e8579e",     // canon: #B83998 — brighter
  OCaml: "#ee6a1c",      // canon: #3be133 (green) — closer to brand orange
  ReasonML: "#ff5847",
  ReScript: "#ed5051",
  "F#": "#b845fc",
  "Common Lisp": "#3fb68b",
  Scheme: "#5b7df7",     // canon: #1e4aec — lifted
  Racket: "#3c5caa",
  "Emacs Lisp": "#c065db",

  // ── Data / queries ──
  R: "#198CE7",
  Julia: "#a270ba",
  SQL: "#e38c00",
  PLpgSQL: "#5d92c5",
  TSQL: "#e38c00",
  Mathematica: "#dd1100",
  MATLAB: "#e16737",

  // ── Shell / config / infra ──
  Shell: "#89e051",
  Bash: "#89e051",
  Fish: "#4aae47",
  PowerShell: "#5391fe",  // canon: #012456 (very dark) — boosted
  Batchfile: "#C1F12E",
  Dockerfile: "#5cb6f5",  // canon: #384d54 (gray) — boosted
  Makefile: "#88c651",
  CMake: "#DA3434",
  HCL: "#844FBA",
  Terraform: "#7B42BC",
  Nix: "#7e7eff",

  // ── GPU / shaders ──
  GLSL: "#5686a5",
  HLSL: "#aace60",
  Cuda: "#5fbf5f",        // canon: #3A4E3A (dark olive) — boosted
  Metal: "#b370ff",       // canon: #8f14e9 — lifted

  // ── Markup / docs ──
  Markdown: "#9ec8ff",    // canon: #083fa1 (dark navy) — boosted
  TeX: "#9bc36b",         // canon: #3D6117 — boosted
  Roff: "#ecdebe",
  reStructuredText: "#ca9866",
  AsciiDoc: "#73a0c5",
  Org: "#77aa99",

  // ── Misc / niche ──
  Solidity: "#AA6746",
  Vala: "#a56de2",
  Verilog: "#b2b7f8",
  SystemVerilog: "#b2b7f8",
  VHDL: "#adb2cb",
  Tcl: "#e4cc98",
  GraphQL: "#e10098",
  Pug: "#a86454",
  Smarty: "#f0c040",
  Twig: "#c1d026",
  Liquid: "#67b8de",
  Handlebars: "#f7931e",
  EJS: "#90a93a",
  Prolog: "#a45e7a",       // canon: #74283c — lifted
  Smalltalk: "#9caa28",
  "Vim Script": "#199f4b",
  "Vim Snippet": "#199f4b",
  YAML: "#cb171e",
  TOML: "#9c4221",
  JSON: "#cbcb41",
  JSON5: "#a8a832",
  XML: "#5fbf5f",
  Protocol: "#9b59b6",
  "Protocol Buffer": "#9b59b6",
  HCL2: "#844FBA",
  Just: "#384d54",
};

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const part = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${part(0)}${part(8)}${part(4)}`;
}

// Deterministic fallback: hash the language name to a hue so unknown
// languages each get a distinct visible color instead of all defaulting
// to the same gray. Saturation/lightness picked so it pops on dark.
function hashToColor(language: string): string {
  let h = 2166136261;
  for (let i = 0; i < language.length; i++) {
    h ^= language.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const hue = h % 360;
  return hslToHex(hue, 55, 62);
}

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? hashToColor(language);
}
