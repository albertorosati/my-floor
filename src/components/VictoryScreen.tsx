import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
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

  useEffect(() => {
    soundEngine.playDuelVictory();
    if (!isDraw) {
      soundEngine.speakAnnouncement(
        language === 'en'
          ? `${localizePlayerName(winner.name, language)} won the match!`
          : `Vince la sfida ${localizePlayerName(winner.name, language)}!`
      );
    }

    const end = Date.now() + 3200;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [winner.name, isDraw, language]);

  const totalP1Correct = history.reduce((acc, h) => acc + h.p1Correct, 0);
  const totalP2Correct = history.reduce((acc, h) => acc + h.p2Correct, 0);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-bg flex flex-col items-center justify-center p-3 sm:p-6 text-center select-none overflow-hidden touch-none">
      <div className="card-paper max-w-xl w-full p-6 sm:p-8 flex flex-col items-center gap-6 animate-pop-in max-h-[96dvh] overflow-y-auto">
        <div className="w-24 h-24 rounded-2xl bg-yellow border-[3px] border-ink shadow-hard flex items-center justify-center text-5xl shrink-0">
          {winner.avatar}
        </div>

        <div>
          <span className="px-4 py-1 rounded-full bg-yellow border-[3px] border-ink font-display font-black text-xs uppercase tracking-wider text-ink">
            {isParty
              ? t('party.champion', language)
              : isDraw
              ? t('victory.tieMatch', language)
              : t('victory.champion', language)}
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-ink mt-3">
            {isDraw
              ? `${p1.avatar} ${t('victory.equalPoints', language)} ${p2.avatar}`
              : `${winner.avatar} ${localizePlayerName(winner.name, language)}`}
          </h1>

          {!isParty && (
            <p className="text-ink/80 font-sans font-bold text-base mt-2">
              {t('victory.finalScore', language)}{' '}
              <span className="text-blue">
                {localizePlayerName(p1.name, language)} {p1Score}
              </span>{' '}
              —{' '}
              <span className="text-red">
                {p2Score} {localizePlayerName(p2.name, language)}
              </span>
            </p>
          )}
        </div>

        {/* Podio / Classifica Party oppure Statistiche 1v1 */}
        {isParty ? (
          <div className="w-full flex flex-col divide-y-2 divide-ink/10 border-y-[3px] border-ink/20 py-1 max-h-48 overflow-y-auto">
            {partyRanked.map((p, idx) => (
              <div
                key={p.id}
                className="py-2.5 px-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-sm text-ink/70">
                    #{idx + 1}
                  </span>
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-display font-bold text-sm text-ink">
                    {localizePlayerName(p.name, language)}
                  </span>
                </div>
                <div className="font-display font-black text-sm text-ink">
                  {p.wins} {t('party.wins', language).toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full flex items-center justify-around py-4 border-y-[3px] border-ink/20">
            <div className="text-center">
              <span className="text-xs font-bold text-ink/60 uppercase block">
                {t('victory.rounds', language)}
              </span>
              <span className="font-display font-black text-3xl text-ink">
                {history.length}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-blue uppercase block truncate">
                {localizePlayerName(p1.name, language)}
              </span>
              <span className="font-display font-black text-3xl text-blue">
                {totalP1Correct}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-red uppercase block truncate">
                {localizePlayerName(p2.name, language)}
              </span>
              <span className="font-display font-black text-3xl text-red">
                {totalP2Correct}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 shrink-0">
          <button
            onClick={onPlayAgain}
            className="btn-push py-3.5 px-5 rounded-xl bg-yellow text-ink font-display font-black text-base sm:text-lg flex items-center justify-center gap-2 border-[3px] border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('victory.rematch', language)}</span>
          </button>
          <button
            onClick={onBackToLobby}
            className="btn-push py-3.5 px-5 rounded-xl bg-paper text-ink font-display font-bold text-base sm:text-lg flex items-center justify-center gap-2 border-[3px] border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Home className="w-5 h-5" />
            <span>{t('victory.backMenu', language)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
