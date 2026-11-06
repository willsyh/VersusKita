// Minimal chess rules engine: legal moves, check, checkmate, stalemate,
// castling, en passant and promotion. Row 0 is rank 8 (black's back rank).

export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export interface Piece {
  t: PieceType;
  c: Color;
}
export type Board = (Piece | null)[][];
export type Sq = [number, number];

export interface Move {
  from: Sq;
  to: Sq;
  promo?: PieceType;
  castle?: "k" | "q";
  ep?: boolean;
  capture?: boolean;
}

export interface ChessState {
  board: Board;
  turn: Color;
  castling: { wk: boolean; wq: boolean; bk: boolean; bq: boolean };
  /** Square a pawn can capture onto en passant, or null. */
  ep: Sq | null;
}

const BACK: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];

export function initialState(): ChessState {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { t: BACK[c], c: "b" };
    board[1][c] = { t: "p", c: "b" };
    board[6][c] = { t: "p", c: "w" };
    board[7][c] = { t: BACK[c], c: "w" };
  }
  return { board, turn: "w", castling: { wk: true, wq: true, bk: true, bq: true }, ep: null };
}

const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const opp = (c: Color): Color => (c === "w" ? "b" : "w");

const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/** Is square (r,c) attacked by any piece of color `by`? */
export function attacked(board: Board, r: number, c: number, by: Color): boolean {
  // Pawns: a white pawn attacks upward (row - 1), so it sits at row + 1.
  const pr = by === "w" ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    const p = inside(pr, c + dc) && board[pr][c + dc];
    if (p && p.c === by && p.t === "p") return true;
  }
  for (const [dr, dc] of KNIGHT) {
    const p = inside(r + dr, c + dc) && board[r + dr][c + dc];
    if (p && p.c === by && p.t === "n") return true;
  }
  for (const [dr, dc] of KING) {
    const p = inside(r + dr, c + dc) && board[r + dr][c + dc];
    if (p && p.c === by && p.t === "k") return true;
  }
  const ray = (dirs: number[][], types: PieceType[]) => {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inside(rr, cc)) {
        const p = board[rr][cc];
        if (p) {
          if (p.c === by && types.includes(p.t)) return true;
          break;
        }
        rr += dr;
        cc += dc;
      }
    }
    return false;
  };
  return ray(DIAG, ["b", "q"]) || ray(ORTHO, ["r", "q"]);
}

export function findKing(board: Board, color: Color): Sq {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c]?.t === "k" && board[r][c]?.c === color) return [r, c];
  return [-1, -1];
}

export function inCheck(s: ChessState, color: Color = s.turn) {
  const [r, c] = findKing(s.board, color);
  return attacked(s.board, r, c, opp(color));
}

function pseudoMoves(s: ChessState, r: number, c: number): Move[] {
  const p = s.board[r][c];
  if (!p) return [];
  const out: Move[] = [];
  const add = (tr: number, tc: number, extra: Partial<Move> = {}) => {
    const target = s.board[tr][tc];
    out.push({ from: [r, c], to: [tr, tc], capture: !!target || !!extra.ep, ...extra });
  };
  const slide = (dirs: number[][]) => {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inside(rr, cc)) {
        const t = s.board[rr][cc];
        if (t && t.c === p.c) break;
        add(rr, cc);
        if (t) break;
        rr += dr;
        cc += dc;
      }
    }
  };

  switch (p.t) {
    case "p": {
      const dir = p.c === "w" ? -1 : 1;
      const start = p.c === "w" ? 6 : 1;
      const last = p.c === "w" ? 0 : 7;
      const pushMove = (tr: number, tc: number, extra: Partial<Move> = {}) => {
        if (tr === last) for (const promo of ["q", "r", "b", "n"] as PieceType[]) add(tr, tc, { ...extra, promo });
        else add(tr, tc, extra);
      };
      if (inside(r + dir, c) && !s.board[r + dir][c]) {
        pushMove(r + dir, c);
        if (r === start && !s.board[r + 2 * dir][c]) add(r + 2 * dir, c);
      }
      for (const dc of [-1, 1]) {
        const tr = r + dir, tc = c + dc;
        if (!inside(tr, tc)) continue;
        const t = s.board[tr][tc];
        if (t && t.c !== p.c) pushMove(tr, tc);
        else if (s.ep && s.ep[0] === tr && s.ep[1] === tc) add(tr, tc, { ep: true });
      }
      break;
    }
    case "n":
      for (const [dr, dc] of KNIGHT) {
        const rr = r + dr, cc = c + dc;
        if (inside(rr, cc) && s.board[rr][cc]?.c !== p.c) add(rr, cc);
      }
      break;
    case "b":
      slide(DIAG);
      break;
    case "r":
      slide(ORTHO);
      break;
    case "q":
      slide([...DIAG, ...ORTHO]);
      break;
    case "k": {
      for (const [dr, dc] of KING) {
        const rr = r + dr, cc = c + dc;
        if (inside(rr, cc) && s.board[rr][cc]?.c !== p.c) add(rr, cc);
      }
      // Castling: king and rook unmoved, squares between empty, king not passing through check.
      const row = p.c === "w" ? 7 : 0;
      if (r === row && c === 4 && !attacked(s.board, row, 4, opp(p.c))) {
        const rights = s.castling;
        const kSide = p.c === "w" ? rights.wk : rights.bk;
        const qSide = p.c === "w" ? rights.wq : rights.bq;
        if (kSide && !s.board[row][5] && !s.board[row][6] && s.board[row][7]?.t === "r" &&
            !attacked(s.board, row, 5, opp(p.c)) && !attacked(s.board, row, 6, opp(p.c))) {
          add(row, 6, { castle: "k" });
        }
        if (qSide && !s.board[row][3] && !s.board[row][2] && !s.board[row][1] && s.board[row][0]?.t === "r" &&
            !attacked(s.board, row, 3, opp(p.c)) && !attacked(s.board, row, 2, opp(p.c))) {
          add(row, 2, { castle: "q" });
        }
      }
      break;
    }
  }
  return out;
}

export function applyMove(s: ChessState, m: Move): ChessState {
  const board = s.board.map((row) => [...row]);
  const [fr, fc] = m.from;
  const [tr, tc] = m.to;
  const p = board[fr][fc]!;
  board[tr][tc] = m.promo ? { t: m.promo, c: p.c } : p;
  board[fr][fc] = null;
  if (m.ep) board[fr][tc] = null; // captured pawn sits beside the moving pawn
  if (m.castle === "k") {
    board[tr][5] = board[tr][7];
    board[tr][7] = null;
  }
  if (m.castle === "q") {
    board[tr][3] = board[tr][0];
    board[tr][0] = null;
  }

  const castling = { ...s.castling };
  if (p.t === "k") {
    if (p.c === "w") castling.wk = castling.wq = false;
    else castling.bk = castling.bq = false;
  }
  // Moving from or capturing on a rook's corner removes that right.
  for (const [r, c] of [m.from, m.to]) {
    if (r === 7 && c === 0) castling.wq = false;
    if (r === 7 && c === 7) castling.wk = false;
    if (r === 0 && c === 0) castling.bq = false;
    if (r === 0 && c === 7) castling.bk = false;
  }

  const ep: Sq | null = p.t === "p" && Math.abs(tr - fr) === 2 ? [(fr + tr) / 2, fc] : null;
  return { board, turn: opp(s.turn), castling, ep };
}

export function legalMovesFrom(s: ChessState, r: number, c: number): Move[] {
  const p = s.board[r][c];
  if (!p || p.c !== s.turn) return [];
  return pseudoMoves(s, r, c).filter((m) => !inCheck(applyMove(s, m), p.c));
}

export function allLegalMoves(s: ChessState): Move[] {
  const out: Move[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) out.push(...legalMovesFrom(s, r, c));
  return out;
}

/** Only kings (or king + one minor piece) left: nobody can checkmate. */
export function insufficientMaterial(board: Board) {
  const rest = board.flat().filter((p): p is Piece => !!p && p.t !== "k");
  return rest.length === 0 || (rest.length === 1 && (rest[0].t === "b" || rest[0].t === "n"));
}

export type Outcome = { type: "checkmate"; winner: Color } | { type: "stalemate" } | { type: "insufficient" } | null;

export function outcome(s: ChessState): Outcome {
  if (insufficientMaterial(s.board)) return { type: "insufficient" };
  if (allLegalMoves(s).length > 0) return null;
  return inCheck(s) ? { type: "checkmate", winner: opp(s.turn) } : { type: "stalemate" };
}
