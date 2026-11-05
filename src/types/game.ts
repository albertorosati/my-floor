export type PlayerId = 'p1' | 'p2';

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  avatar: string;
  primaryHex: string;
  secondaryHex: string;
  glowClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export interface DuelItem {
  id: string;
  /** Risposta principale mostrata a schermo dopo aver indovinato o passato */
  answer: string;
  /** Lista di sinonimi, varianti fonetiche IT/EN, plurali o soprannomi accettati */
  aliases: string[];
  /** URL immagine ad alta leggibilità (SVG/PNG/Wikimedia/Twemoji/Custom DataURL) */
  imageUrl: string;
  /** Emoji/SVG fallback ad altissima risoluzione se offline o in caricamento */
  fallbackEmoji?: string;
  /** Sottotitolo o indizio visivo opzionale (es. solo se abilitato) */
  subLabel?: string;
}

export interface Category {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  themeHex: string;
  items: DuelItem[];
  isCustom?: boolean;
}

export interface GridTile {
  index: number;
  row: number;
  col: number;
  owner: PlayerId;
  category: Category;
  /** Quante volte questo territorio ha cambiato padrone */
  battlesCount: number;
}

export type MicMode = 'local-shared' | 'discord-p2p';

export type GridSizeOption = '3x3' | '3x4' | '4x4';

export interface GameSettings {
  gridSize: GridSizeOption;
  duelDurationSeconds: number;
  passPenaltySeconds: number;
  micMode: MicMode;
  soundEnabled: boolean;
  announcerEnabled: boolean;
  autoRevealAnswerMs: number;
}

export interface DuelSummary {
  winner: PlayerId;
  loser: PlayerId;
  categoryName: string;
  categoryIcon: string;
  winnerTimeLeft: number;
  p1Correct: number;
  p2Correct: number;
  p1Passes: number;
  p2Passes: number;
  conqueredTilesCount: number;
}

export interface VoiceMatchResult {
  matched: boolean;
  isPassCommand: boolean;
  matchedAlias?: string;
  confidenceScore: number;
  normalizedHeard: string;
}

export interface RemoteMicPacket {
  type: 'TRANSCRIPT' | 'PASS_BUTTON' | 'MIC_LEVEL' | 'PING' | 'STATE_UPDATE';
  transcript?: string;
  alternatives?: string[];
  isFinal?: boolean;
  micLevel?: number;
  activePlayer?: PlayerId;
  p1Name?: string;
  p2Name?: string;
  categoryName?: string;
  inDuel?: boolean;
  timeLeftP2?: number;
}
