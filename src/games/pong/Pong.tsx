"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps, PlayerId } from "../types";
import { sfx } from "@/lib/sound";
import { toHex } from "@/lib/colors";

const WIN_SCORE = 5;

/**
 * Pong in a single canvas. Physics runs on two abstract axes:
 *   u = along the field (from Player 1's goal to Player 2's goal)
 *   v = across the field (the direction paddles move)
 * Portrait: P1 at the bottom, P2 at the top. Landscape: P1 left, P2 right.
 */
export default function Pong({ players, onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<Record<PlayerId, number>>({ 1: 0, 2: 0 });
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const color1 = players[1].color;
  const color2 = players[2].color;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0, L = 0, S = 0, portrait = true;
    const st = {
      ball: { u: 0, v: 0, du: 0, dv: 0 },
      speed: 0,
      pad: { 1: 0, 2: 0 } as Record<PlayerId, number>, // paddle center on v
      target: { 1: 0, 2: 0 } as Record<PlayerId, number>,
      score: { 1: 0, 2: 0 } as Record<PlayerId, number>,
      serveAt: performance.now() + 1200,
      serveDir: Math.random() < 0.5 ? 1 : -1,
      over: false,
    };
    const keys = new Set<string>();

    const padLen = () => Math.max(60, S * 0.22);
    const thick = 14;
    const off = 28; // paddle distance from goal
    const r = () => Math.max(7, S * 0.022);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      portrait = H >= W;
      L = portrait ? H : W;
      S = portrait ? W : H;
      st.pad[1] = st.pad[2] = st.target[1] = st.target[2] = S / 2;
      resetBall();
    };

    const resetBall = () => {
      st.ball = { u: L / 2, v: S / 2, du: 0, dv: 0 };
      st.speed = Math.max(260, S * 0.75);
    };

    // u,v -> screen x,y
    const toXY = (u: number, v: number): [number, number] => (portrait ? [v, L - u] : [u, v]);
    // screen x,y -> u,v
    const toUV = (x: number, y: number): [number, number] => (portrait ? [L - y, x] : [x, y]);

    // Each finger controls the paddle of the half where it first touched.
    const owners = new Map<number, PlayerId>();
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const [u, v] = toUV(e.clientX - rect.left, e.clientY - rect.top);
      if (e.type === "pointerdown") owners.set(e.pointerId, u < L / 2 ? 1 : 2);
      const p: PlayerId = owners.get(e.pointerId) ?? (u < L / 2 ? 1 : 2);
      st.target[p] = v;
    };
    const onPointerEnd = (e: PointerEvent) => owners.delete(e.pointerId);
    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") keys.add(e.key.toLowerCase());
      else keys.delete(e.key.toLowerCase());
    };

    const serve = () => {
      const angle = (Math.random() - 0.5) * 0.8;
      st.ball.du = Math.cos(angle) * st.speed * st.serveDir;
      st.ball.dv = Math.sin(angle) * st.speed;
    };

    const hitPaddle = (p: PlayerId) => {
      const b = st.ball;
      const offset = Math.max(-1, Math.min(1, (b.v - st.pad[p]) / (padLen() / 2)));
      const angle = offset * 1.0; // up to ~57°
      st.speed = Math.min(st.speed * 1.06, S * 2.2);
      const dir = p === 1 ? 1 : -1;
      b.du = Math.cos(angle) * st.speed * dir;
      b.dv = Math.sin(angle) * st.speed;
      sfx.bounce();
    };

    const point = (p: PlayerId) => {
      st.score[p]++;
      setScore({ ...st.score });
      sfx.correct();
      if (st.score[p] >= WIN_SCORE) {
        st.over = true;
        onFinishRef.current({ winner: p, detail: `Skor ${st.score[1]} – ${st.score[2]}` });
        return;
      }
      st.serveDir = p === 1 ? 1 : -1; // serve toward the player who conceded
      resetBall();
      st.serveAt = performance.now() + 900;
    };

    const step = (dt: number, now: number) => {
      // Keyboard paddles
      const kv = S * 1.3 * dt;
      if (keys.has("w") || keys.has("a")) st.target[1] = st.pad[1] - kv * 4;
      if (keys.has("s") || keys.has("d")) st.target[1] = st.pad[1] + kv * 4;
      if (keys.has("arrowup") || keys.has("arrowleft")) st.target[2] = st.pad[2] - kv * 4;
      if (keys.has("arrowdown") || keys.has("arrowright")) st.target[2] = st.pad[2] + kv * 4;

      for (const p of [1, 2] as PlayerId[]) {
        const half = padLen() / 2;
        const t = Math.max(half, Math.min(S - half, st.target[p]));
        const maxMove = S * 3 * dt;
        st.pad[p] += Math.max(-maxMove, Math.min(maxMove, t - st.pad[p]));
      }

      if (st.over) return;
      const b = st.ball;
      if (b.du === 0 && b.dv === 0) {
        if (now >= st.serveAt) serve();
        return;
      }
      b.u += b.du * dt;
      b.v += b.dv * dt;
      const rad = r();
      if (b.v < rad) { b.v = rad; b.dv = Math.abs(b.dv); sfx.bounce(); }
      if (b.v > S - rad) { b.v = S - rad; b.dv = -Math.abs(b.dv); sfx.bounce(); }

      const half = padLen() / 2;
      const p1u = off, p2u = L - off;
      if (b.du < 0 && b.u - rad <= p1u + thick / 2 && b.u > p1u - thick && Math.abs(b.v - st.pad[1]) <= half + rad) {
        b.u = p1u + thick / 2 + rad;
        hitPaddle(1);
      }
      if (b.du > 0 && b.u + rad >= p2u - thick / 2 && b.u < p2u + thick && Math.abs(b.v - st.pad[2]) <= half + rad) {
        b.u = p2u - thick / 2 - rad;
        hitPaddle(2);
      }
      if (b.u < -rad) point(2);
      else if (b.u > L + rad) point(1);
    };

    const c1 = toHex(color1);
    const c2 = toHex(color2);
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
    const dark = document.documentElement.classList.contains("dark");

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // Halves
      const halfRect = (p: PlayerId) => {
        const [x1, y1] = toXY(p === 1 ? 0 : L / 2, 0);
        const [x2, y2] = toXY(p === 1 ? L / 2 : L, S);
        ctx.fillStyle = (p === 1 ? c1 : c2) + (dark ? "33" : "1f");
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      };
      halfRect(1);
      halfRect(2);
      // Center line
      ctx.strokeStyle = dark ? "#ffffff40" : "#00000025";
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      const [ax, ay] = toXY(L / 2, 0);
      const [bx, by] = toXY(L / 2, S);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      // Scores (each facing its player)
      ctx.font = `700 ${Math.round(S * 0.16)}px ${font}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of [1, 2] as PlayerId[]) {
        const [x, y] = toXY(p === 1 ? L * 0.3 : L * 0.7, S / 2);
        ctx.save();
        ctx.translate(x, y);
        if (portrait && p === 2) ctx.rotate(Math.PI);
        ctx.fillStyle = (p === 1 ? c1 : c2) + "55";
        ctx.fillText(String(st.score[p]), 0, 0);
        ctx.restore();
      }
      // Paddles
      for (const p of [1, 2] as PlayerId[]) {
        const u = p === 1 ? off : L - off;
        const half = padLen() / 2;
        const [x1, y1] = toXY(u - thick / 2, st.pad[p] - half);
        const [x2, y2] = toXY(u + thick / 2, st.pad[p] + half);
        ctx.fillStyle = p === 1 ? c1 : c2;
        ctx.beginPath();
        ctx.roundRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), 7);
        ctx.fill();
      }
      // Ball
      const [bxp, byp] = toXY(st.ball.u, st.ball.v);
      ctx.fillStyle = dark ? "#ffffff" : "#18142e";
      ctx.beginPath();
      ctx.arc(bxp, byp, r(), 0, Math.PI * 2);
      ctx.fill();
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      step(dt, now);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [color1, color2]);

  return (
    <div ref={wrapRef} className="tap-zone relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block" aria-label={`Pong: ${players[1].name} ${score[1]}, ${players[2].name} ${score[2]}`} />
    </div>
  );
}
