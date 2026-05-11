export interface RPGStats {
  level: number;
  xp: number;
  className: string;
  classEmoji: string;
  stamina: number;
  maxStamina: number;
  guildContributions: number;
  title: string;
}

const CLASS_MAP: Record<string, { name: string; emoji: string }> = {
  TypeScript: { name: "Type Architect", emoji: "🏗️" },
  JavaScript: { name: "Script Sorcerer", emoji: "✨" },
  Python: { name: "Data Mage", emoji: "🐍" },
  Rust: { name: "Memory Warden", emoji: "⚙️" },
  Go: { name: "Concurrency Monk", emoji: "🧘" },
  Java: { name: "Enterprise Paladin", emoji: "🛡️" },
  "C++": { name: "System Overlord", emoji: "⚔️" },
  C: { name: "Bare Metal Knight", emoji: "🗡️" },
  "C#": { name: "Unity Mage", emoji: "🎮" },
  Ruby: { name: "Gem Crafter", emoji: "💎" },
  PHP: { name: "Web Alchemist", emoji: "🧪" },
  Swift: { name: "Apple Ranger", emoji: "🍎" },
  Kotlin: { name: "Android Sage", emoji: "🤖" },
  Shell: { name: "Terminal Rogue", emoji: "🖥️" },
  HTML: { name: "Markup Bard", emoji: "📜" },
  CSS: { name: "Style Enchanter", emoji: "🎨" },
  Dart: { name: "Flutter Dancer", emoji: "🦋" },
  Lua: { name: "Moon Scribe", emoji: "🌙" },
  Scala: { name: "Functional Sage", emoji: "📐" },
  Vue: { name: "Reactive Druid", emoji: "🌿" },
  Svelte: { name: "Compiled Mystic", emoji: "🔮" },
};

function getTitle(level: number): string {
  if (level >= 90) return "Legendary";
  if (level >= 70) return "Master";
  if (level >= 50) return "Veteran";
  if (level >= 30) return "Journeyman";
  if (level >= 15) return "Apprentice";
  return "Novice";
}

export function computeRPGStats(
  totalCommits: number,
  primaryLanguage: string | null,
  currentStreak: number,
  repoCount: number
): RPGStats {
  // Logarithmic XP curve, cap at level 100
  const xp = totalCommits;
  const level = Math.min(100, Math.floor(15 * Math.log2(totalCommits + 1)));

  const classInfo =
    (primaryLanguage ? CLASS_MAP[primaryLanguage] : null) ?? {
      name: "Code Wanderer",
      emoji: "🧭",
    };

  const maxStamina = 30;
  const stamina = Math.min(currentStreak, maxStamina);

  return {
    level,
    xp,
    className: classInfo.name,
    classEmoji: classInfo.emoji,
    stamina,
    maxStamina,
    guildContributions: repoCount,
    title: getTitle(level),
  };
}
