"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx } from "@/lib/sound";

/** 3-2-1 countdown. Returns the current number; 0 means "go". */
export function useCountdown(from = 3, stepMs = 700) {
  const [count, setCount] = useState(from);
  useEffect(() => {
    if (count <= 0) return;
    sfx.tick();
    const t = setTimeout(() => {
      if (count === 1) sfx.go();
      setCount(count - 1);
    }, stepMs);
    return () => clearTimeout(t);
  }, [count, stepMs]);
  return count;
}

/** Big number in the middle of the screen while counting down. */
export function CountdownBadge({ count }: { count: number }) {
  return (
    <AnimatePresence mode="popLayout">
      {count > 0 && (
        <motion.div
          key={count}
          initial={{ scale: 2.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          className="grid h-24 w-24 place-items-center rounded-full bg-white font-display text-5xl font-bold text-slate-900 shadow-2xl"
        >
          {count}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
