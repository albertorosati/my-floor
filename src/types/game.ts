export type PlayerId = 'p1' | 'p2';

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  avatar: string;
}

export interface DuelItem {
  id: string;
  answer: string;
  aliases: string[];
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  themeHex: string;
  coverImage?: string;
  previewImages?: string[];
  items: DuelItem[];
  isCustom?: boolean;
}

export type MicMode = 'local-shared' | 'discord-p2p';

/** 0 = Partita libera senza limite di punti */
export type TargetWinsOption = 3 | 5 | 7 | 0;

export interface GameSettings {
  targetWins: TargetWinsOption;
  duelDurationSeconds: number;
  passPenaltySeconds: number;
  micMode: MicMode;
  soundEnabled: boolean;
  announcerEnabled: boolean;
}

export interface DuelSummary {
  roundNumber: number;
  winner: PlayerId;
  loser: PlayerId;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  winnerTimeLeft: number;
  p1Correct: number;
  p2Correct: number;
  p1Passes: number;
  p2Passes: number;
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
