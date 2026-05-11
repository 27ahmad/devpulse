import { useMotionValue, useTransform } from "framer-motion";

export const fadeStagger = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.7,
      ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export function useTransformedColor(palette: { primary: string; accent: string }) {
  const t = useMotionValue(0);
  return useTransform(t, [0, 1], [palette.primary, palette.accent]);
}
