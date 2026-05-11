import { motion } from "framer-motion";
import { Copy, Download, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

interface Props {
  ctx: SceneContext;
  onDeepDive: () => void;
}

export function ShareCardScene({ ctx, onDeepDive }: Props) {
  const { user, insights, palette } = ctx;
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 p-5 sm:rounded-3xl sm:p-10"
        style={{
          background: `linear-gradient(140deg, ${palette.deep}, #0a0a12 60%)`,
          boxShadow: `0 30px 100px ${palette.primary}33`,
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full" style={{ background: palette.primary, opacity: 0.18, filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full" style={{ background: palette.accent, opacity: 0.15, filter: "blur(80px)" }} />

        <div className="relative flex items-center gap-4">
          <img src={user.avatar_url} alt={user.login} className="h-14 w-14 rounded-full ring-1 ring-white/10" />
          <div className="text-left">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">DevPulse · {new Date().getFullYear()}</div>
            <div className="text-lg font-semibold text-white">@{user.login}</div>
          </div>
        </div>

        <h2
          className="relative mt-8 text-left text-4xl font-semibold leading-tight sm:mt-10 sm:text-6xl"
          style={{
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.primary})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {insights.archetype.name}
        </h2>
        <p className="relative mt-4 max-w-md text-left text-sm text-white/70">
          {insights.archetype.tagline}
        </p>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-4">
          <Stat label="Contributions" value={insights.totalContributions.toLocaleString()} />
          <Stat label="Active days" value={insights.activeDays.toLocaleString()} />
          <Stat label="Languages" value={insights.languagesUsedCount.toString()} />
          <Stat label="Longest streak" value={`${insights.longestStreak}d`} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/10"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy link"}
        </button>
        <a
          href={`/api/og?user=${encodeURIComponent(user.login)}`}
          download={`devpulse-${user.login}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/10"
        >
          <Download size={14} />
          Download card
        </a>
        <button
          onClick={onDeepDive}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-black"
          style={{ background: palette.primary }}
        >
          Deep dive
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </SceneShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-left">
      <div className="text-xl font-semibold tabular-nums text-white">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}
