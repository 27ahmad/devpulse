export interface RPGStats {
  level: number;
  xp: number;
  xpToNext: number;
  className: string;
  classEmoji: string;
  title: string;
  consistency: number;
  repoCount: number;
  contributions: number;
  commits: number;
  prs: number;
  reviews: number;
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
};

function getTitle(level: number): string {
  if (level >= 90) return "Legendary";
  if (level >= 70) return "Master";
  if (level >= 50) return "Veteran";
  if (level >= 30) return "Journeyman";
  if (level >= 15) return "Apprentice";
  return "Novice";
}

export function computeRPGStats({
  totalContributions,
  commits,
  pullRequests,
  reviews,
  primaryLanguage,
  consistency,
  repoCount,
}: {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  primaryLanguage: string | null;
  consistency: number;
  repoCount: number;
}): RPGStats {
  const xp = totalContributions;
  const level = Math.min(100, Math.floor(15 * Math.log2(totalContributions + 1)));
  const xpToNext = Math.round(Math.pow(2, (level + 1) / 15) - 1);

  const classInfo =
    (primaryLanguage ? CLASS_MAP[primaryLanguage] : null) ?? {
      name: "Code Wanderer",
      emoji: "🧭",
    };

  return {
    level,
    xp,
    xpToNext,
    className: classInfo.name,
    classEmoji: classInfo.emoji,
    title: getTitle(level),
    consistency,
    repoCount,
    contributions: totalContributions,
    commits,
    prs: pullRequests,
    reviews,
  };
}
