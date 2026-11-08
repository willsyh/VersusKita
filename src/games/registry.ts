import type { GameDefinition } from "./types";
import { ticTacToe } from "./tic-tac-toe";
import { connectFour } from "./connect-four";
import { tapBattle } from "./tap-battle";
import { reactionDuel } from "./reaction-duel";
import { rockPaperScissors } from "./rock-paper-scissors";
import { memoryMatch } from "./memory-match";
import { tugOfWar } from "./tug-of-war";
import { quiz } from "./quiz";
import { pong } from "./pong";
import { dotsAndBoxes } from "./dots-and-boxes";
import { chess } from "./chess";
import { checkers } from "./checkers";
import { congklak } from "./congklak";
import { gomoku } from "./gomoku";
import { penalty } from "./penalty";
import { tenSeconds } from "./ten-seconds";
import { mathDuel } from "./math-duel";
import { colorMatch } from "./color-match";
import { basketball } from "./basketball";
import { minesweeper } from "./minesweeper";

/**
 * All playable games. To add a new game, create a folder with a component
 * and an index.ts definition, then add it to this list.
 */
export const GAMES: GameDefinition[] = [
  ticTacToe,
  connectFour,
  tapBattle,
  reactionDuel,
  rockPaperScissors,
  memoryMatch,
  tugOfWar,
  quiz,
  pong,
  dotsAndBoxes,
  chess,
  checkers,
  congklak,
  gomoku,
  penalty,
  tenSeconds,
  mathDuel,
  colorMatch,
  basketball,
  minesweeper,
];

export const getGame = (id: string) => GAMES.find((g) => g.id === id);
