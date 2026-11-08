"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Wind } from "lucide-react";
import type { GameProps, PlayerId } from "../types";
import TurnBanner from "@/components/TurnBanner";
import { sfx, vibrate } from "@/lib/sound";
import { cn, other } from "@/lib/utils";

// World units; the canvas scales the scene to fit. The world is narrower and
// taller on portrait phones so characters stay big.
const FENCE_W = 28;
const HIT_R = 38;
const BALL_R = 11;
const GRAVITY = 900;
const WIND_FORCE = 260;
const MAX_HP = 100;
const GUIDE_SECONDS = 0.22; // only the start of the path is shown, so aiming takes skill

type Phase = "aim" | "fly" | "result";

const newWind = () => Math.round((Math.random() * 2 - 1) * 10) / 10; // -1..1

export default function ThrowDuel({ players, startingPlayer, onFinish }: GameProps) {
  const [hp, setHp] = useState<Record<PlayerId, number>>({ 1: MAX_HP, 2: MAX_HP });
  const [turn, setTurn] = useState<PlayerId>(startingPlayer);
  const [wind, setWind] = useState(newWind);
  const [phase, setPhase] = useState<Phase>("aim");
  const [fenceH] = useState(() => 170 + Math.random() * 110);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // The animation loop reads the latest values through this ref.
  const live = useRef({ hp, turn, wind, phase, players, onFinish });
  live.current = { hp, turn, wind, phase, players, onFinish };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dark = document.documentElement.classList.contains("dark");
    const css = getComputedStyle(document.documentElement);
    const col = (p: PlayerId) => `rgb(${css.getPropertyValue(`--p${p}`).trim()})`;
    const font = css.getPropertyValue("--font-display").trim() || "sans-serif";

    let cw = 0, ch = 0, scale = 1, ox = 0, oy = 0;
    let W = 1000, H = 560, GROUND = 500;
    const charX = (p: PlayerId) => (p === 1 ? W * 0.12 : W * 0.88);
    const charY = () => GROUND - 44; // body center
    const fenceX = () => W / 2;
    const st = {
      drag: null as null | { sx: number; sy: number; x: number; y: number; id: number },
      ball: null as null | { x: number; y: number; vx: number; vy: number; t: number; by: PlayerId; rot: number },
      trail: [] as { x: number; y: number }[],
      floats: [] as { x: number; y: number; text: string; color: string; t: number }[],
      shake: 0,
      hurt: { 1: 0, 2: 0 } as Record<PlayerId, number>,
      throwAnim: { 1: 0, 2: 0 } as Record<PlayerId, number>,
      time: 0,
      timers: [] as ReturnType<typeof setTimeout>[],
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      cw = r.width;
      ch = r.height;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      const portrait = ch > cw;
      W = portrait ? 620 : 1000;
      H = Math.min(1300, Math.max(520, (W * ch) / cw));
      GROUND = H - 60;
      scale = Math.min(cw / W, ch / H);
      ox = (cw - W * scale) / 2;
      oy = (ch - H * scale) / 2;
    };

    const origin = (p: PlayerId) => ({ x: charX(p) + (p === 1 ? 30 : -30), y: charY() - 40 });

    /** Drag back like a slingshot: direction is opposite the drag, length is power. */
    const aimVelocity = () => {
      if (!st.drag) return null;
      const dx = (st.drag.sx - st.drag.x) / scale;
      const dy = (st.drag.sy - st.drag.y) / scale;
      const len = Math.hypot(dx, dy);
      if (len < 12) return null;
      const power = Math.min(1, len / 260);
      const speed = 260 + 700 * power;
      return { vx: (dx / len) * speed, vy: (dy / len) * speed, power };
    };

    const down = (e: PointerEvent) => {
      if (live.current.phase !== "aim" || st.drag) return;
      canvas.setPointerCapture(e.pointerId);
      st.drag = { sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (st.drag?.id !== e.pointerId) return;
      st.drag.x = e.clientX;
      st.drag.y = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (st.drag?.id !== e.pointerId) return;
      const v = aimVelocity();
      st.drag = null;
      if (!v || live.current.phase !== "aim") return;
      const p = live.current.turn;
      const o = origin(p);
      st.ball = { x: o.x, y: o.y, vx: v.vx, vy: v.vy, t: 0, by: p, rot: 0 };
      st.trail = [];
      st.throwAnim[p] = 1;
      sfx.tap();
      setPhase("fly");
    };

    const floatText = (x: number, y: number, text: string, color: string) => st.floats.push({ x, y, text, color, t: 0 });

    /** Ends the throw: apply damage, then pass the turn or finish the round. */
    const resolve = (damage: Partial<Record<PlayerId, number>>, label?: { x: number; y: number; text: string }) => {
      st.ball = null;
      const { hp: cur, turn: thrower, players: pl, onFinish: finish } = live.current;
      const next = { ...cur };
      for (const p of [1, 2] as PlayerId[]) {
        const d = damage[p] ?? 0;
        if (d > 0) {
          next[p] = Math.max(0, next[p] - d);
          st.hurt[p] = 1;
          floatText(charX(p), charY() - 90, `-${d}`, "#ef4444");
        }
      }
      if (label) floatText(label.x, label.y, label.text, dark ? "#fde047" : "#ca8a04");
      const hit = Object.values(damage).some((d) => (d ?? 0) > 0);
      if (hit) {
        st.shake = 1;
        sfx.correct();
        vibrate(60);
      } else sfx.bounce();
      setHp(next);
      setPhase("result");

      const loser = ([1, 2] as PlayerId[]).find((p) => next[p] <= 0);
      st.timers.push(
        setTimeout(() => {
          if (loser) {
            const winner = next[1] <= 0 && next[2] <= 0 ? thrower : other(loser);
            finish({ winner, detail: `Sisa HP ${pl[winner].name}: ${next[winner]}` });
            return;
          }
          setTurn(other(thrower));
          setWind(newWind());
          setPhase("aim");
        }, 1100),
      );
    };

    const step = (dt: number) => {
      st.time += dt;
      st.shake = Math.max(0, st.shake - dt * 3);
      for (const p of [1, 2] as PlayerId[]) {
        st.hurt[p] = Math.max(0, st.hurt[p] - dt * 2.5);
        st.throwAnim[p] = Math.max(0, st.throwAnim[p] - dt * 4);
      }
      st.floats = st.floats.filter((f) => (f.t += dt) < 1.2);

      const b = st.ball;
      if (!b) return;
      b.t += dt;
      b.vx += live.current.wind * WIND_FORCE * dt;
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += dt * 12;
      if (st.trail.length === 0 || Math.hypot(b.x - st.trail[st.trail.length - 1].x, b.y - st.trail[st.trail.length - 1].y) > 14) st.trail.push({ x: b.x, y: b.y });
      if (st.trail.length > 18) st.trail.shift();

      // Characters (the thrower is safe for a moment after release)
      for (const p of [1, 2] as PlayerId[]) {
        if (p === b.by && b.t < 0.35) continue;
        const d = Math.hypot(b.x - charX(p), b.y - charY());
        if (d < HIT_R + BALL_R) {
          const head = b.y < charY() - 14;
          const dmg = head ? 35 + Math.round(Math.random() * 5) : 22 + Math.round(Math.random() * 8);
          return resolve({ [p]: dmg }, { x: charX(p), y: charY() - 130, text: p === b.by ? "Senjata makan tuan!" : head ? "Kena kepala!" : "Kena!" });
        }
      }
      // Fence
      const fenceTop = GROUND - fenceH;
      if (Math.abs(b.x - fenceX()) < FENCE_W / 2 + BALL_R && b.y > fenceTop - BALL_R) {
        return resolve({}, { x: fenceX(), y: fenceTop - 30, text: "Kena pagar!" });
      }
      // Ground: small splash damage when landing close to someone
      if (b.y >= GROUND - BALL_R) {
        const dmg: Partial<Record<PlayerId, number>> = {};
        for (const p of [1, 2] as PlayerId[]) {
          const d = Math.abs(b.x - charX(p));
          if (d < 95) dmg[p] = Math.max(4, Math.round(14 * (1 - d / 95)));
        }
        return resolve(dmg, Object.keys(dmg).length ? { x: b.x, y: GROUND - 60, text: "Cipratan!" } : { x: b.x, y: GROUND - 40, text: "Meleset" });
      }
      // Out of the scene
      if (b.x < -60 || b.x > W + 60) return resolve({}, { x: b.x < 0 ? 80 : W - 80, y: 120, text: "Meleset" });
    };

    // --- Drawing -------------------------------------------------------------
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const shx = st.shake ? Math.sin(st.time * 70) * 8 * st.shake : 0;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + shx * scale), dpr * oy);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, dark ? "#1e1b4b" : "#7dd3fc");
      sky.addColorStop(1, dark ? "#312e81" : "#e0f2fe");
      ctx.fillStyle = sky;
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 24);
      ctx.fill();
      ctx.save();
      ctx.clip();

      // Clouds drift with the wind
      ctx.fillStyle = dark ? "#ffffff18" : "#ffffffcc";
      for (let i = 0; i < 4; i++) {
        const x = ((i * 290 + st.time * live.current.wind * 40) % (W + 200) + W + 200) % (W + 200) - 100;
        const y = 60 + (i % 2) * 50;
        ctx.beginPath();
        ctx.ellipse(x, y, 60, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 40, y - 12, 40, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = dark ? "#166534" : "#4ade80";
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = dark ? "#14532d" : "#22c55e";
      ctx.fillRect(0, GROUND, W, 8);

      // Fence
      const top = GROUND - fenceH;
      ctx.fillStyle = dark ? "#a16207" : "#d97706";
      ctx.strokeStyle = dark ? "#713f12" : "#92400e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fenceX() - FENCE_W / 2, GROUND);
      ctx.lineTo(fenceX() - FENCE_W / 2, top + 12);
      ctx.lineTo(fenceX(), top);
      ctx.lineTo(fenceX() + FENCE_W / 2, top + 12);
      ctx.lineTo(fenceX() + FENCE_W / 2, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (let y = top + 40; y < GROUND; y += 50) {
        ctx.beginPath();
        ctx.moveTo(fenceX() - FENCE_W / 2, y);
        ctx.lineTo(fenceX() + FENCE_W / 2, y);
        ctx.stroke();
      }

      // Characters
      const { turn: t, phase: ph, players: pl, hp: hps } = live.current;
      for (const p of [1, 2] as PlayerId[]) {
        const x = charX(p);
        const bob = ph === "aim" && t === p ? Math.sin(st.time * 6) * 4 : 0;
        const lean = st.throwAnim[p] * (p === 1 ? 0.35 : -0.35) - st.hurt[p] * (p === 1 ? 0.3 : -0.3);
        // Shadow
        ctx.fillStyle = "#00000025";
        ctx.beginPath();
        ctx.ellipse(x, GROUND + 4, 40, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Colored base so each side is clearly marked
        ctx.fillStyle = col(p);
        ctx.beginPath();
        ctx.arc(x, charY() + bob, HIT_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(x, charY() + bob);
        ctx.rotate(lean);
        if (p === 2) ctx.scale(-1, 1); // face each other
        ctx.font = `64px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (st.hurt[p] > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(st.time * 30));
        ctx.fillText(pl[p].emoji, 0, 2);
        ctx.restore();
        ctx.globalAlpha = 1;

        // HP bar
        const bw = 110, bx = x - bw / 2, by = charY() - HIT_R - 34;
        ctx.fillStyle = "#00000040";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, 12, 6);
        ctx.fill();
        const ratio = hps[p] / MAX_HP;
        ctx.fillStyle = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#eab308" : "#ef4444";
        ctx.beginPath();
        ctx.roundRect(bx, by, Math.max(0, bw * ratio), 12, 6);
        ctx.fill();
        ctx.font = `600 18px ${font}, sans-serif`;
        ctx.fillStyle = dark ? "#fff" : "#0f172a";
        ctx.textAlign = "center";
        ctx.fillText(pl[p].name, x, by - 10);
      }

      // Aim: arrow + the first part of the path
      const v = aimVelocity();
      if (v && ph === "aim") {
        const o = origin(t);
        let x = o.x, y = o.y, vx = v.vx, vy = v.vy;
        const dt = 1 / 60;
        for (let i = 0; i * dt < GUIDE_SECONDS; i++) {
          vx += live.current.wind * WIND_FORCE * dt;
          vy += GRAVITY * dt;
          x += vx * dt;
          y += vy * dt;
          if (i % 2 === 0) {
            ctx.fillStyle = dark ? "#ffffffcc" : "#0f172acc";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Power meter next to the thrower
        const mx = charX(t) + (t === 1 ? -70 : 60), my = charY() - 30;
        ctx.fillStyle = "#00000030";
        ctx.fillRect(mx, my - 60, 10, 80);
        ctx.fillStyle = v.power > 0.8 ? "#ef4444" : v.power > 0.5 ? "#eab308" : "#22c55e";
        ctx.fillRect(mx, my + 20 - 80 * v.power, 10, 80 * v.power);
      }

      // Projectile + trail
      const b = st.ball;
      if (b) {
        st.trail.forEach((pt, i) => {
          ctx.fillStyle = col(b.by);
          ctx.globalAlpha = (i / st.trail.length) * 0.4;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, BALL_R * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = col(b.by);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-BALL_R, 0);
        ctx.lineTo(BALL_R, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Floating texts
      for (const f of st.floats) {
        ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2);
        ctx.font = `700 28px ${font}, sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = dark ? "#000" : "#fff";
        ctx.strokeText(f.text, f.x, f.y - f.t * 40);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y - f.t * 40);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      for (let i = 0; i < 3; i++) step(dt / 3);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      st.timers.forEach(clearTimeout);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [fenceH]);

  const strength = Math.round(Math.abs(wind) * 10);

  return (
    <div className="flex h-full flex-col items-center gap-2 p-2 sm:gap-3 sm:p-3">
      <TurnBanner players={players} turn={phase === "aim" ? turn : null} scores={hp} label="Giliran lempar" />
      <div className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-sm font-semibold dark:bg-white/10">
        <Wind size={16} />
        Angin
        {strength === 0 ? (
          <span className="opacity-60">tenang</span>
        ) : (
          <span className={cn("flex items-center gap-0.5", wind < 0 ? "flex-row-reverse" : "")}>
            {Array.from({ length: Math.ceil(strength / 3.4) }, (_, i) =>
              wind < 0 ? <ArrowLeft key={i} size={15} /> : <ArrowRight key={i} size={15} />,
            )}
            <span className="mx-1 tabular-nums">{strength}</span>
          </span>
        )}
      </div>
      <div ref={wrapRef} className="tap-zone relative min-h-0 w-full flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 block" aria-label="Arena lempar" />
      </div>
      <p className="text-center text-xs font-semibold opacity-60">
        {phase === "aim" ? `${players[turn].name}: tarik ke belakang lalu lepas untuk melempar. Perhatikan angin!` : " "}
      </p>
    </div>
  );
}
