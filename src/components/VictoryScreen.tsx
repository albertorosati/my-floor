import React, { useEffect } from 'react';
import { RotateCcw, Home } from 'lucide-react';
import {
  DuelSummary,
  GameMode,
  PartyPlayer,
  PlayerConfig,
  PlayerId,
  AppLanguage,
} from '../types/game';
import { soundEngine } from '../engine/soundEffects';
import { rankPartyPlayers } from '../utils/partyUtils';
import { t, localizePlayerName } from '../services/i18n';
import { TheFloorBackground } from './TheFloorBackground';
import { InlineCrown } from './InlineCrown';
import { getPlayerColor } from '../utils/playerColors';
import { APP_VERSION } from '../config/version';

interface VictoryScreenProps {
  mode?: GameMode;
  winnerId: PlayerId;
  p1: PlayerConfig;
  p2: PlayerConfig;
  partyPlayers?: PartyPlayer[];
  p1Score: number;
  p2Score: number;
  history: DuelSummary[];
  language?: AppLanguage;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  mode = 'duel',
  winnerId,
  p1,
  p2,
  partyPlayers = [],
  p1Score,
  p2Score,
  history,
  language = 'it',
  onPlayAgain,
  onBackToLobby,
}) => {
  const isParty = mode === 'party';
  const isDraw = !isParty && p1Score === p2Score;

  // In Party mode, find player with highest wins
  const partyRanked = rankPartyPlayers(partyPlayers);
  const partyWinner = partyRanked[0];
  const winner = isParty ? partyWinner || p1 : winnerId === 'p1' ? p1 : p2;
  const winnerColor = getPlayerColor(winner.id);

  useEffect(() => {
    soundEngine.playDuelVictory();
    if (!isDraw) {
      soundEngine.speakAnnouncement(
        language === 'en'
          ? `${localizePlayerName(winner.name, language)} won the match!`
          : `Vince la sfida ${localizePlayerName(winner.name, language)}!`
      );
    }
  }, [winner.name, isDraw, language]);

  const totalP1Correct = history.reduce((acc, h) => acc + h.p1Correct, 0);
  const totalP2Correct = history.reduce((acc, h) => acc + h.p2Correct, 0);

  const activeStage = isDraw ? 'neutral' : winner.id;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full relative overflow-hidden flex flex-col items-center justify-center p-3 sm:p-6 text-center select-none touch-none">
      {/* 1. Signature Floor Background in winner's stage color */}
      <TheFloorBackground stage={activeStage} />

      {/* 2. Flat CSS Confetti Squares */}
      <div className="absolute top-10 left-12 w-7 h-7 bg-yellow border-[3px] border-ink rotate-12 animate-confetti-flat z-20 pointer-events-none" />
      <div className="absolute top-16 right-16 w-8 h-8 bg-red border-[3px] border-ink -rotate-12 animate-confetti-flat z-20 pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-6 h-6 bg-blue border-[3px] border-ink rotate-45 animate-confetti-flat z-20 pointer-events-none" />
      <div className="absolute bottom-16 right-24 w-7 h-7 bg-green border-[3px] border-ink -rotate-6 animate-confetti-flat z-20 pointer-events-none" />
      <div className="absolute top-1/3 left-6 w-5 h-5 bg-paper border-[3px] border-ink rotate-12 animate-confetti-flat z-20 pointer-events-none" />
      <div className="absolute top-1/2 right-8 w-6 h-6 bg-yellow border-[3px] border-ink rotate-45 animate-confetti-flat z-20 pointer-events-none" />

      {/* 3. Victory Card (1100px Max, Centered, Tactile) */}
      <div className="relative z-10 card-paper max-w-xl w-full p-6 sm:p-8 flex flex-col items-center gap-6 animate-starburst-pop max-h-[96dvh] overflow-y-auto">
        {/* Starburst + Large Winner Avatar with Crown */}
        <div className="relative flex items-center justify-center my-2">
          {!isDraw && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
              <InlineCrown size="lg" />
            </div>
          )}
          {/* Flat starburst shape behind avatar */}
          <div
            className="w-32 h-32 rounded-3xl border-[3px] border-ink shadow-hard flex items-center justify-center text-7xl animate-pip-bounce -rotate-3"
            style={{ backgroundColor: winnerColor.bgHex }}
          >
            {winner.avatar}
          </div>
        </div>

        <div>
          {/* Winner Badge Pill */}
          <span className="px-4 py-1.5 rounded-full bg-yellow border-[3px] border-ink font-display font-black text-xs uppercase tracking-wider text-ink inline-block mb-3 shadow-hard-sm">
            {isParty
              ? t('party.champion', language)
              : isDraw
              ? t('victory.tieMatch', language)
              : t('victory.champion', language)}
          </span>

          <h1 className="font-display font-black text-3xl sm:text-5xl text-ink tracking-tight -rotate-1">
            {isDraw
              ? `${p1.avatar} ${t('victory.equalPoints', language)} ${p2.avatar}`
              : `${localizePlayerName(winner.name, language)}`}
          </h1>

          {!isDraw && !isParty && (
            <div className="font-display font-black text-2xl text-yellow bg-ink px-4 py-1 rounded-xl border-[3px] border-ink inline-block mt-2 rotate-1">
              {language === 'en' ? 'WINS!' : 'VINCE!'}
            </div>
          )}
        </div>

        {/* Final Score Recap for 1v1: Plain Numbers + Winner Crown */}
        {!isParty && (
          <div className="w-full flex items-center justify-center gap-4 sm:gap-8 py-4 px-3 bg-white/70 border-[3px] border-ink rounded-2xl shadow-hard-sm">
            {/* P1 Recap */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="relative flex items-center justify-center">
                <span className="text-3xl">{p1.avatar}</span>
                {p1Score > p2Score && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <InlineCrown size="sm" />
                  </div>
                )}
              </div>
              <span className="font-display font-black text-sm text-blue truncate max-w-full">
                {localizePlayerName(p1.name, language)}
              </span>
              <span className="font-display font-black text-3xl text-ink tabular-nums">
                {p1Score}
              </span>
            </div>

            <div className="font-display font-black text-xl text-ink/40 shrink-0">
              VS
            </div>

            {/* P2 Recap */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="relative flex items-center justify-center">
                <span className="text-3xl">{p2.avatar}</span>
                {p2Score > p1Score && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <InlineCrown size="sm" />
                  </div>
                )}
              </div>
              <span className="font-display font-black text-sm text-red truncate max-w-full">
                {localizePlayerName(p2.name, language)}
              </span>
              <span className="font-display font-black text-3xl text-ink tabular-nums">
                {p2Score}
              </span>
            </div>
          </div>
        )}

        {/* Podio / Classifica Party oppure Statistiche 1v1 */}
        {isParty ? (
          <div className="w-full flex flex-col divide-y-2 divide-ink/10 border-y-[3px] border-ink/20 py-1 max-h-48 overflow-y-auto">
            {partyRanked.map((p, idx) => (
              <div
                key={p.id}
                className="py-2.5 px-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="font-display font-black text-sm text-ink/70 mr-1.5">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl">{p.avatar}</span>
                    {idx === 0 && (
                      <div className="absolute -top-3 right-0">
                        <InlineCrown size="sm" />
                      </div>
                    )}
                  </div>
                  <span className="font-display font-bold text-sm text-ink">
                    {localizePlayerName(p.name, language)}
                  </span>
                </div>
                <div className="font-display font-black text-sm text-ink tabular-nums">
                  {p.wins} {t('party.wins', language).toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-around py-3 border-y-[3px] border-ink">
            <div className="text-center">
              <span className="text-xs font-bold text-ink/60 uppercase block">
                {t('victory.rounds', language)}
              </span>
              <span className="font-display font-black text-3xl text-ink tabular-nums">
                {history.length}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-blue uppercase block truncate">
                {localizePlayerName(p1.name, language)}
              </span>
              <span className="font-display font-black text-3xl text-blue tabular-nums">
                {totalP1Correct}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-red uppercase block truncate">
                {localizePlayerName(p2.name, language)}
              </span>
              <span className="font-display font-black text-3xl text-red tabular-nums">
                {totalP2Correct}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons: Rematch (Yellow) and Menu (Paper) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 shrink-0">
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn-push py-3.5 px-5 rounded-xl bg-yellow text-ink font-display font-black text-base sm:text-lg flex items-center justify-center gap-2 border-[3px] border-ink shadow-hard"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('victory.rematch', language)}</span>
          </button>
          <button
            type="button"
            onClick={onBackToLobby}
            className="btn-push py-3.5 px-5 rounded-xl bg-paper text-ink font-display font-bold text-base sm:text-lg flex items-center justify-center gap-2 border-[3px] border-ink shadow-hard"
          >
            <Home className="w-5 h-5" />
            <span>{t('victory.backMenu', language)}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-ink/40 pt-1">
          v{APP_VERSION}
        </div>
      </div>
    </div>
  );
};
