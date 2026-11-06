"use client";

import { useState } from "react";
import type { PlayerId } from "@/games/types";
import { cn } from "@/lib/utils";

/**
 * A full-half tap area for one player. Uses pointerdown so two people can
 * tap at the same time (multi-touch) without waiting for "click".
 */
export default function TapZone({
  player,
  onTap,
  disabled,
  children,
  className,
}: {
  player: PlayerId;
  onTap: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      role="button"
      aria-label={`Area Pemain ${player}`}
      onPointerDown={(e) => {
        e.preventDefault();
        if (disabled) return;
        setPressed(true);
        onTap();
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "tap-zone flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center transition-[filter,transform] duration-75",
        player === 1 ? "bg-p1/15 dark:bg-p1/25" : "bg-p2/15 dark:bg-p2/25",
        pressed && "brightness-110 saturate-150",
        !disabled && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
