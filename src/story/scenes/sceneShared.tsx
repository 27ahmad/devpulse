import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";

export function CountUp({
  value,
  duration = 1.6,
  className,
  format = (n: number) => Math.round(n).toLocaleString(),
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = mv.on("change", (v) => setDisplay(format(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, duration, mv, format]);

  return <span className={className}>{display}</span>;
}

export function SceneShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`absolute inset-0 flex flex-col items-center justify-center px-8 text-center ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function WordReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + i * 0.08,
            duration: 0.7,
            ease: [0.2, 0.7, 0.2, 1],
          }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

interface CharRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerPerChar?: number;
  charClassName?: string;
}

export function CharReveal({
  text,
  className = "",
  delay = 0,
  staggerPerChar = 0.05,
  charClassName = "",
}: CharRevealProps) {
  return (
    <span className={className} style={{ display: "inline-block" }}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          initial={{ y: "120%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + i * staggerPerChar,
            duration: 0.6,
            ease: [0.2, 0.7, 0.2, 1],
          }}
          className={charClassName}
          style={{
            display: "inline-block",
            whiteSpace: ch === " " ? "pre" : "normal",
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}
