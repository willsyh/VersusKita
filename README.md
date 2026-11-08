# Versus Kita 🎮

> Siapa yang paling jago di antara kita?

Kumpulan mini game untuk **2 pemain di satu perangkat**. Dibuat dengan Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, dan Zustand.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build produksi
npm start          # jalankan hasil build
```

Supaya bisa dicoba di HP: jalankan `npm run dev -- -H 0.0.0.0`, lalu buka `http://<IP-komputer>:3000` dari HP di jaringan Wi-Fi yang sama.

## Fitur

- **19 game**
  - Strategi: Catur, Dam, Congklak, Lima Sejajar, Tic Tac Toe, Connect Four
  - Refleks: Tap Battle, Reaction Duel, Tarik Tambang, Pong, Stop di 10 Detik, Duel Basket
  - Otak/Puzzle: Memory Match, Dots and Boxes, Adu Hitung Cepat, Tebak Warna
  - Keberuntungan: Batu Gunting Kertas, Adu Penalti
  - Kuis: Kuis Siapa Paling Tahu
- Nama, avatar emoji, dan warna untuk tiap pemain (warna yang sama tidak bisa dipilih dua pemain)
- Papan skor global di header, riwayat pertandingan, mode **Sekali / Best of 3 / Best of 5**
- **Turnamen Acak**: 5 game acak berturut-turut, lalu juara dinobatkan
- Layar dibagi untuk game real-time: atas-bawah di HP (sisi atas diputar 180° untuk pemain di seberang), kiri-kanan di layar mendatar
- Kontrol keyboard di laptop (A / L, W/S / ↑↓, A/S/D / J/K/L)
- Confetti, efek suara hasil sintesis (tanpa file audio), getaran, hukuman lucu (opsional), mode gelap
- Semua data disimpan di `localStorage`

## Struktur folder

```
src/
├── app/
│   ├── layout.tsx            # font, header, mode gelap tanpa kedip
│   ├── page.tsx              # halaman utama: hero, setup pemain, filter, grid game
│   ├── main/[id]/            # halaman bermain: /main/tic-tac-toe, /main/pong, ...
│   ├── riwayat/page.tsx      # riwayat pertandingan & bar rivalitas
│   └── turnamen/page.tsx     # mode turnamen acak
├── components/
│   ├── GameShell.tsx         # pembungkus setiap game: cara main, best-of, layar menang, rematch
│   ├── SplitScreen.tsx       # layout layar dibagi dua + kontrol keyboard
│   ├── TapZone.tsx           # area tap multi-touch untuk game real-time
│   ├── TurnBanner.tsx        # penanda giliran untuk game bergiliran
│   ├── Countdown.tsx         # hitung mundur 3-2-1
│   ├── Header.tsx            # papan skor global
│   ├── SettingsSheet.tsx     # suara, getaran, hukuman, mode gelap, reset
│   ├── PlayerSetup.tsx       # input nama, avatar, warna
│   └── Providers.tsx
├── games/
│   ├── types.ts              # GameProps & GameDefinition (kontrak untuk semua game)
│   ├── registry.ts           # daftar semua game
│   ├── tic-tac-toe/
│   │   ├── TicTacToe.tsx     # komponen game
│   │   └── index.ts          # metadata: nama, kategori, durasi, cara main
│   └── ...                   # satu folder per game
└── lib/
    ├── store.ts              # pemain, skor, riwayat, pengaturan (Zustand + localStorage)
    ├── sound.ts              # efek suara Web Audio + getaran
    ├── confetti.ts, colors.ts, punishments.ts, utils.ts
```

## Menambah game baru

Setiap game hanya perlu memenuhi satu kontrak: menerima `GameProps` dan memanggil `onFinish` sekali saat ronde selesai. Skor, best-of, layar menang, rematch, riwayat, dan turnamen sudah diurus oleh `GameShell`.

**1. Buat komponennya** di `src/games/tebak-angka/TebakAngka.tsx`:

```tsx
"use client";
import type { GameProps } from "../types";

export default function TebakAngka({ players, startingPlayer, onFinish }: GameProps) {
  // ...logika game...
  // Saat ronde selesai:
  //   onFinish({ winner: 1 })                    -> Pemain 1 menang
  //   onFinish({ winner: null })                 -> seri (ronde diulang)
  //   onFinish({ winner: 2, detail: "Skor 3-1" }) -> dengan keterangan
  return <div className="h-full">...</div>;
}
```

Komponen akan di-mount ulang setiap ronde baru, jadi state cukup disimpan di dalam komponen. Untuk game real-time, gunakan `<SplitScreen p1={...} p2={...} />` dan `<TapZone>`. Untuk game bergiliran, gunakan `<TurnBanner>`. Untuk game adu cepat "Benar/Salah", cukup pakai `<QuickDuel generate={...} />` (lihat `math-duel` dan `color-match`). Game yang lama dimainkan bisa diberi `skipInTournament: true` supaya tidak terpilih di Turnamen Acak.

**2. Daftarkan metadatanya** di `src/games/tebak-angka/index.ts`:

```ts
import type { GameDefinition } from "../types";
import TebakAngka from "./TebakAngka";

export const tebakAngka: GameDefinition = {
  id: "tebak-angka",              // jadi URL: /main/tebak-angka
  name: "Tebak Angka",
  emoji: "🔢",
  tagline: "Tebak angka rahasia lawan.",
  category: "otak",               // strategi | refleks | otak | keberuntungan | kuis
  duration: "1-2 menit",
  mode: "turn",                   // turn | realtime | simultaneous
  howTo: ["Langkah 1...", "Langkah 2..."],
  component: TebakAngka,
};
```

**3. Tambahkan ke** `src/games/registry.ts`:

```ts
import { tebakAngka } from "./tebak-angka";
export const GAMES = [/* ...game lain */, tebakAngka];
```

Selesai. Game otomatis muncul di grid, filter kategori, dan Turnamen Acak.

## Mode Online (tahap berikutnya)

Belum dibuat; tombolnya sudah ada di halaman utama dengan label "Segera". Rencana yang disarankan:

1. Pakai **Supabase Realtime** (channel per kode room, misalnya `room:ABCD12`).
2. Halaman `/room/[kode]`: pemain 1 membuat room, pemain 2 bergabung lewat kode atau link.
3. Mulai dari game bergiliran dan game "bersamaan" (Tic Tac Toe, Connect Four, Batu Gunting Kertas, Dots and Boxes): kirim setiap langkah sebagai pesan `{ type: "move", payload }`, lalu kedua klien menerapkan langkah yang sama.
4. Game real-time (Pong, Tap Battle) butuh sinkronisasi waktu dan sebaiknya dikerjakan paling akhir.
