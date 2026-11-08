"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameProps, PlayerId } from "../types";
import SplitScreen, { usePortrait } from "@/components/SplitScreen";
import { CountdownBadge, useCountdown } from "@/components/Countdown";
import { sfx, vibrate } from "@/lib/sound";
import { cn } from "@/lib/utils";

const DURATION = 30_000;
const MOVING_AFTER = 3; // baskets before the hoop starts sliding

/** Hoop spot (0..1 across the court), never right above the ball so a shot needs an arc. */
const sideSpot = () => (Math.random() < 0.5 ? 0.05 + Math.random() * 0.3 : 0.65 + Math.random() * 0.3);

export default function Basketball({ players, onFinish }: GameProps) {
  const count = useCountdown(3);
  const portrait = usePortrait();
  const [left, setLeft] = useState(DURATION);
  const [scores, setScores] = useState<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const scoresRef = useRef(scores);
  const running = count === 0 && left > 0;

  useEffect(() => {
    if (count !== 0) return;
    const start = performance.now();
    const id = setInterval(() => {
      const remaining = Math.max(0, DURATION - (performance.now() - start));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        const s = scoresRef.current;
        onFinish({ winner: s[1] === s[2] ? null : s[1] > s[2] ? 1 : 2, detail: `${s[1]} – ${s[2]} poin` });
      }
    }, 100);
    return () => clearInterval(id);
  }, [count, onFinish]);

  const onScore = useCallback((p: PlayerId, points: number) => {
    scoresRef.current = { ...scoresRef.current, [p]: scoresRef.current[p] + points };
    setScores(scoresRef.current);
  }, []);

  const court = (p: PlayerId) => (
    <Court
      player={p}
      name={players[p].name}
      emoji={players[p].emoji}
      score={scores[p]}
      active={running}
      // Player 2's half is rotated 180° in portrait, so touch coordinates are flipped.
      rotated={portrait && p === 2}
      onScore={onScore}
    />
  );

  return (
    <SplitScreen
      p1={court(1)}
      p2={court(2)}
      center={
        count > 0 ? (
          <CountdownBadge count={count} />
        ) : (
          <div className="rounded-full bg-white px-4 py-1.5 font-display text-xl font-bold tabular-nums text-slate-900 shadow-xl">{Math.ceil(left / 1000)}s</div>
        )
      }
    />
  );
}

interface CourtProps {
  player: PlayerId;
  name: string;
  emoji: string;
  score: number;
  active: boolean;
  rotated: boolean;
  onScore: (p: PlayerId, points: number) => void;
}

/** One player's half: hoop at the top, ball at the bottom, drag back to shoot. */
function Court({ player, name, emoji, score, active, rotated, onScore }: CourtProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [popup, setPopup] = useState<{ id: number; text: string } | null>(null);
  // Values the animation loop reads without restarting.
  const live = useRef({ active, rotated, onScore });
  live.current = { active, rotated, onScore };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--p${player}`).trim();
    const dark = document.documentElement.classList.contains("dark");

    let W = 0, H = 0;
    // Geometry derived from the court size.
    const geo = () => {
      const rimW = Math.max(54, Math.min(W * 0.24, 110));
      const r = rimW * 0.22;
      return { rimW, r, hoopY: Math.max(r * 4.5, H * 0.33), startY: H - r - 18, g: H * 4, maxDrag: Math.max(120, H * 0.45) };
    };

    const st = {
      ball: { x: 0, y: 0, vx: 0, vy: 0, rot: 0 },
      flying: false,
      scored: false,
      rimTouched: false,
      drag: null as null | { sx: number; sy: number; x: number; y: number; id: number },
      baskets: 0,
      hoopBase: sideSpot(),
      t: 0,
    };

    const resetBall = () => {
      const { startY } = geo();
      // Start on the side opposite the hoop so every shot needs an arc.
      // Once the hoop moves, pick a random side each shot.
      const hoopOnRight = st.baskets >= MOVING_AFTER ? Math.random() < 0.5 : st.hoopBase > 0.5;
      st.ball = { x: hoopOnRight ? W * 0.2 : W * 0.8, y: startY, vx: 0, vy: 0, rot: 0 };
      st.flying = false;
      st.scored = false;
      st.rimTouched = false;
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      resetBall();
    };

    /** Hoop center x; slides left and right once the player gets good. */
    const hoopX = () => {
      const { rimW } = geo();
      const margin = rimW / 2 + 22;
      const base = margin + (W - 2 * margin) * st.hoopBase;
      if (st.baskets < MOVING_AFTER) return base;
      const amp = Math.min((W - 2 * margin) / 2, 30 + st.baskets * 8);
      const center = W / 2;
      return center + Math.sin(st.t * (0.9 + st.baskets * 0.08)) * amp;
    };

    /**
     * Pull length maps linearly to speed (not to height), so the useful
     * pull range is wide and shots feel controllable.
     */
    const shotVelocity = () => {
      const { maxDrag } = geo();
      if (!st.drag) return { vx: 0, vy: 0 };
      const dx = st.drag.sx - st.drag.x;
      const dy = st.drag.sy - st.drag.y;
      const len = Math.hypot(dx, dy);
      if (len < 18) return { vx: 0, vy: 0 };
      const t = Math.min(1, len / maxDrag);
      const speed = H * (1.6 + 1.5 * t);
      return { vx: (dx / len) * speed, vy: (dy / len) * speed };
    };

    // --- Input -------------------------------------------------------------
    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return live.current.rotated ? { x: rect.right - e.clientX, y: rect.bottom - e.clientY } : { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const down = (e: PointerEvent) => {
      if (!live.current.active || st.flying || st.drag) return;
      canvas.setPointerCapture(e.pointerId);
      const p = local(e);
      st.drag = { sx: p.x, sy: p.y, x: p.x, y: p.y, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (!st.drag || st.drag.id !== e.pointerId) return;
      const p = local(e);
      st.drag.x = p.x;
      st.drag.y = p.y;
    };
    const up = (e: PointerEvent) => {
      if (!st.drag || st.drag.id !== e.pointerId) return;
      const v = shotVelocity();
      st.drag = null;
      // Ignore tiny drags or shots that don't go upward.
      if (!live.current.active || v.vy >= 0) return;
      st.ball.vx = v.vx;
      st.ball.vy = v.vy;
      st.flying = true;
      sfx.tap();
    };

    // --- Physics -----------------------------------------------------------
    const collideCircle = (cx: number, cy: number, cr: number, restitution: number) => {
      const b = st.ball;
      const { r } = geo();
      const dx = b.x - cx, dy = b.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0 || dist >= r + cr) return false;
      const nx = dx / dist, ny = dy / dist;
      b.x = cx + nx * (r + cr);
      b.y = cy + ny * (r + cr);
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= (1 + restitution) * vn * nx;
        b.vy -= (1 + restitution) * vn * ny;
      }
      return true;
    };

    const step = (dt: number) => {
      st.t += dt;
      if (!st.flying) return;
      const b = st.ball;
      const { g, r, rimW, hoopY } = geo();
      const hx = hoopX();
      const rimL = hx - rimW / 2, rimR = hx + rimW / 2;
      const boardX = hx > W / 2 ? rimR + 8 : rimL - 8;
      const prevY = b.y;

      b.vy += g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += (b.vx * dt) / r;

      // Side walls
      if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx) * 0.6; }
      if (b.x > W - r) { b.x = W - r; b.vx = -Math.abs(b.vx) * 0.6; }

      // Backboard (vertical segment)
      const top = hoopY - rimW * 0.95, bottom = hoopY + rimW * 0.15;
      if (b.y > top && b.y < bottom && Math.abs(b.x - boardX) < r) {
        b.x = boardX + (b.x < boardX ? -r : r);
        b.vx = -b.vx * 0.55;
        sfx.bounce();
      }
      collideCircle(boardX, top, 3, 0.5);

      // Rim edges
      for (const rx of [rimL, rimR]) {
        if (collideCircle(rx, hoopY, 3, 0.55)) {
          if (!st.rimTouched) sfx.bounce();
          st.rimTouched = true;
        }
      }

      // The net blocks a ball coming up from below the hoop.
      if (b.vy < 0 && prevY > hoopY && b.y <= hoopY + r * 0.3 && b.x > rimL && b.x < rimR) {
        b.y = hoopY + r * 0.3;
        b.vy = Math.abs(b.vy) * 0.25;
        st.rimTouched = true;
        sfx.bounce();
      }

      // Through the hoop, going down
      if (!st.scored && b.vy > 0 && prevY < hoopY && b.y >= hoopY && b.x > rimL && b.x < rimR) {
        st.scored = true;
        st.baskets++;
        const swish = !st.rimTouched;
        const pts = swish ? 3 : 2;
        live.current.onScore(player, pts);
        setPopup({ id: Date.now(), text: swish ? "SWISH! +3" : "+2" });
        sfx.correct();
        vibrate(40);
        if (st.baskets < MOVING_AFTER) st.hoopBase = sideSpot();
      }

      if (b.y > H + r * 2) resetBall();
    };

    // --- Drawing -----------------------------------------------------------
    const drawBall = (x: number, y: number, r: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = Math.max(1.5, r * 0.09);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 1.25, 0, r * 0.85, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 1.25, 0, r * 0.85, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const { r, rimW, hoopY, g } = geo();
      const hx = hoopX();
      const rimL = hx - rimW / 2, rimR = hx + rimW / 2;
      const boardRight = hx > W / 2;
      const boardX = boardRight ? rimR + 8 : rimL - 8;

      // Floor line
      ctx.strokeStyle = dark ? "#ffffff22" : "#00000018";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 8);
      ctx.lineTo(W, H - 8);
      ctx.stroke();

      // Backboard + bracket
      ctx.fillStyle = dark ? "#e5e7eb" : "#ffffff";
      ctx.strokeStyle = dark ? "#9ca3af" : "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boardX - 4, hoopY - rimW * 0.95, 8, rimW * 1.1, 3);
      ctx.fill();
      ctx.stroke();

      // Net (behind the ball)
      ctx.strokeStyle = dark ? "#ffffffaa" : "#94a3b8";
      ctx.lineWidth = 1.2;
      const netH = rimW * 0.55;
      for (let i = 0; i <= 4; i++) {
        const x0 = rimL + (rimW * i) / 4;
        const x1 = hx - rimW * 0.3 + (rimW * 0.6 * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x0, hoopY);
        ctx.lineTo(x1, hoopY + netH);
        ctx.stroke();
      }
      for (let k = 1; k <= 2; k++) {
        const y = hoopY + (netH * k) / 3;
        const shrink = (rimW * 0.2 * k) / 3;
        ctx.beginPath();
        ctx.moveTo(rimL + shrink, y);
        ctx.lineTo(rimR - shrink, y);
        ctx.stroke();
      }

      // Trajectory guide while aiming
      if (st.drag && !st.flying) {
        const v = shotVelocity();
        if (v.vy < 0) {
          let x = st.ball.x, y = st.ball.y, vx = v.vx, vy = v.vy;
          const dt = 1 / 60;
          for (let i = 0; i < 110; i++) {
            vy += g * dt;
            x += vx * dt;
            y += vy * dt;
            if (y > H || x < 0 || x > W) break;
            if (i % 4 === 0) {
              ctx.fillStyle = `rgb(${color} / ${Math.max(0.15, 1 - i / 110)})`;
              ctx.beginPath();
              ctx.arc(x, y, Math.max(2, r * 0.16), 0, Math.PI * 2);
              ctx.fill();
            }
          }
          // Pull line (slingshot)
          ctx.strokeStyle = dark ? "#ffffff55" : "#00000033";
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(st.ball.x, st.ball.y);
          ctx.lineTo(st.ball.x - (st.drag.sx - st.drag.x), st.ball.y - (st.drag.sy - st.drag.y));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Ball: drawn behind the rim front when falling into the hoop
      const behind = st.flying && st.ball.vy > 0 && Math.abs(st.ball.y - hoopY) < r * 2 && st.ball.x > rimL && st.ball.x < rimR;
      if (behind) drawBall(st.ball.x, st.ball.y, r, st.ball.rot);

      // Rim
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rimL, hoopY);
      ctx.lineTo(rimR, hoopY);
      ctx.stroke();
      ctx.lineCap = "butt";

      if (!behind) drawBall(st.ball.x, st.ball.y, r, st.ball.rot);

      // Hint ring around the resting ball
      if (!st.flying && !st.drag && live.current.active) {
        ctx.strokeStyle = `rgb(${color} / ${0.4 + 0.3 * Math.sin(st.t * 5)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(st.ball.x, st.ball.y, r + 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      // Sub-steps keep fast balls from passing through the rim.
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
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [player]);

  return (
    <div ref={wrapRef} className={cn("tap-zone relative h-full w-full overflow-hidden", player === 1 ? "bg-p1/10" : "bg-p2/10")}>
      <canvas ref={canvasRef} className="absolute inset-0 block" aria-label={`Lapangan ${name}`} />
      <div className="pointer-events-none absolute left-3 top-2 flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className={cn("font-display font-semibold", player === 1 ? "text-p1" : "text-p2")}>{name}</span>
      </div>
      <motion.div key={score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="pointer-events-none absolute right-3 top-1 font-display text-3xl font-bold tabular-nums">
        {score}
      </motion.div>
      <AnimatePresence>
        {popup && (
          <motion.div
            key={popup.id}
            initial={{ y: 10, opacity: 0, scale: 0.6 }}
            animate={{ y: -10, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => setTimeout(() => setPopup((p) => (p?.id === popup.id ? null : p)), 500)}
            className="pointer-events-none absolute inset-x-0 top-1/2 text-center font-display text-3xl font-bold text-yellow-500 drop-shadow"
          >
            {popup.text}
          </motion.div>
        )}
      </AnimatePresence>
      {!active && <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs font-semibold opacity-60">Tarik bola ke bawah, lepas untuk menembak</div>}
    </div>
  );
}
