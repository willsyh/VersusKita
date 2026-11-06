"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Keeps <html> in sync with the store (dark mode, player colors) and
 * holds rendering until localStorage has been read, so scores never flicker.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  // localStorage is read synchronously on the client, so after mount the store is ready.
  // Rendering only after mount keeps server HTML and first client render identical.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const dark = useStore((s) => s.settings.dark);
  const c1 = useStore((s) => s.players[1].color);
  const c2 = useStore((s) => s.players[2].color);

  useEffect(() => {
    // First visit: follow the system theme.
    if (hydrated && !localStorage.getItem("versus-kita")) {
      useStore.getState().setSetting("dark", matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.style.setProperty("--p1", c1);
    document.documentElement.style.setProperty("--p2", c2);
  }, [c1, c2, hydrated]);

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="animate-pulse font-display text-3xl font-bold">
          <span className="text-p1">Versus</span> <span className="text-p2">Kita</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
