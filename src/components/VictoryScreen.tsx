import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Crown, Medal } from 'lucide-react';
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
import { APP_VERSION } from '../config/version';
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
    <div className="h-[100dvh] max-h-[100dvh] w-full party-stage-bg flex flex-col items-center justify-center p-3 sm:p-6 text-center select-none overflow-hidden touch-none">
      <div className="card-cream max-w-xl w-full rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-5 animate-pop-in border-[4px] border-ink shadow-chunky max-h-[96dvh] overflow-y-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gold border-[3px] border-ink shadow-chunky flex items-center justify-center text-4xl sm:text-5xl animate-bounce-soft shrink-0">
          {isParty ? <Crown className="w-12 h-12 text-ink" /> : <Trophy className="w-12 h-12 text-ink" />}
        </div>

        <div>
          <span className="px-3.5 py-1 rounded-full bg-paper border-2 border-ink font-display font-bold text-xs uppercase text-ink">
            {isParty
              ? t('party.champion', language)
              : isDraw
              ? t('victory.tieMatch', language)
              : t('victory.champion', language)}
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-ink mt-2">
            {isDraw
              ? `${p1.avatar} ${t('victory.equalPoints', language)} ${p2.avatar}`
              : `${winner.avatar} ${localizePlayerName(winner.name, language)}`}
          </h1>

          {!isParty && (
            <p className="text-ink/70 font-semibold text-sm mt-1">
              {t('victory.finalScore', language)}{' '}
              <strong>
                {localizePlayerName(p1.name, language)} {p1Score}
              </strong>{' '}
              —{' '}
              <strong>
                {p2Score} {localizePlayerName(p2.name, language)}
              </strong>
            </p>
          )}
        </div>

        {/* Podio / Classifica Party oppure Statistiche 1v1 */}
        {isParty ? (
          <div className="w-full flex flex-col gap-2 max-h-48 overflow-y-auto">
            {partyRanked.map((p, idx) => (
              <div
                key={p.id}
                className={`p-2.5 sm:p-3 rounded-2xl border-2 border-ink flex items-center justify-between ${
                  idx === 0
                    ? 'bg-gold/30 shadow-sm'
                    : 'bg-paper'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-xl font-display font-bold text-xs flex items-center justify-center ${
                      idx === 0
                        ? 'bg-gold text-ink border border-ink'
                        : 'bg-ink text-cream'
                    }`}
                  >
                    {idx === 0 ? '👑' : `#${idx + 1}`}
                  </span>
                  <span className="text-xl sm:text-2xl">{p.avatar}</span>
                  <span className="font-display font-bold text-sm text-ink">
                    {localizePlayerName(p.name, language)}
                  </span>
                </div>
                <div className="px-2.5 py-0.5 rounded-lg bg-white border border-ink/20 font-display font-black text-sm text-ink">
                  {p.wins} {t('party.wins', language).toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full grid grid-cols-3 gap-2.5 bg-paper p-3 sm:p-4 rounded-2xl border-2 border-ink shrink-0">
            <div>
              <span className="text-xs font-bold text-ink/60 block">{t('victory.rounds', language)}</span>
              <span className="font-display font-bold text-xl sm:text-2xl text-ink">
                {history.length}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-p1 block truncate">
                {t('victory.playerPhotos', language, { name: localizePlayerName(p1.name, language) })}
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-ink">
                {totalP1Correct}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-p2 block truncate">
                {t('victory.playerPhotos', language, { name: localizePlayerName(p2.name, language) })}
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-ink">
                {totalP2Correct}
              </span>
            </div>
          </div>
        )}

        {/* Pulsanti Azione */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 shrink-0">
          <button
            onClick={onPlayAgain}
            className="btn-push py-3 px-5 rounded-2xl bg-gold text-ink font-display font-bold text-base sm:text-lg flex items-center justify-center gap-2 border-2 border-ink"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('victory.rematch', language)}</span>
          </button>
          <button
            onClick={onBackToLobby}
            className="btn-push py-3 px-5 rounded-2xl bg-white text-ink font-display font-bold text-base sm:text-lg flex items-center justify-center gap-2 border-2 border-ink"
          >
            <Home className="w-5 h-5" />
            <span>{t('victory.backMenu', language)}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-ink/40">
          v{APP_VERSION}
        </div>
      </div>
    </div>
  );
};
