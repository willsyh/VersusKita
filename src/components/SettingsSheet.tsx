"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Moon, RotateCcw, Trash2, Vibrate, Volume2, X, type LucideIcon } from "lucide-react";
import { useStore, type Settings } from "@/lib/store";
import { cn } from "@/lib/utils";

const TOGGLES: { key: keyof Settings; label: string; hint: string; icon: LucideIcon }[] = [
  { key: "sound", label: "Efek suara", hint: "Bunyi saat tap & menang", icon: Volume2 },
  { key: "vibration", label: "Getaran", hint: "Getar di HP saat menang", icon: Vibrate },
  { key: "punishment", label: "Hukuman lucu", hint: "Tantangan acak untuk yang kalah", icon: Flame },
  { key: "dark", label: "Mode gelap", hint: "Nyaman di malam hari", icon: Moon },
];

export default function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const resetScore = useStore((s) => s.resetScore);
  const clearHistory = useStore((s) => s.clearHistory);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Pengaturan"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 dark:bg-[#1a1730] sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Pengaturan</h2>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 dark:bg-white/10" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <ul className="space-y-2">
              {TOGGLES.map((t) => (
                <li key={t.key}>
                  <button
                    onClick={() => setSetting(t.key, !settings[t.key])}
                    className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.03] p-3 text-left dark:bg-white/5"
                    role="switch"
                    aria-checked={settings[t.key]}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-black/5 dark:bg-white/10">
                      <t.icon size={20} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{t.label}</span>
                      <span className="block text-xs opacity-60">{t.hint}</span>
                    </span>
                    <span className={cn("relative h-7 w-12 rounded-full transition", settings[t.key] ? "bg-gradient-to-r from-p1 to-p2" : "bg-black/15 dark:bg-white/20")}>
                      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", settings[t.key] ? "left-6" : "left-1")} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="btn-ghost text-sm"
                onClick={() => {
                  if (confirm("Reset skor jadi 0 – 0?")) resetScore();
                }}
              >
                <RotateCcw size={16} /> Reset skor
              </button>
              <button
                className="btn-ghost text-sm"
                onClick={() => {
                  if (confirm("Hapus semua riwayat pertandingan?")) clearHistory();
                }}
              >
                <Trash2 size={16} /> Hapus riwayat
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
