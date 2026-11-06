import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy } from 'lucide-react';
import { DuelSummary, PlayerConfig, PlayerId, AppLanguage } from '../types/game';
import { soundEngine } from '../engine/soundEffects';
import { APP_VERSION } from '../config/version';

interface VictoryScreenProps {
  winnerId: PlayerId;
  p1: PlayerConfig;
  p2: PlayerConfig;
  p1Score: number;
  p2Score: number;
  history: DuelSummary[];
  language?: AppLanguage;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winnerId,
  p1,
  p2,
  p1Score,
  p2Score,
  history,
  language = 'it',
  onPlayAgain,
  onBackToLobby,
}) => {
  const isDraw = p1Score === p2Score;
  const winner = winnerId === 'p1' ? p1 : p2;

  useEffect(() => {
    soundEngine.playDuelVictory();
    if (!isDraw) {
      soundEngine.speakAnnouncement(
        language === 'en'
          ? `${winner.name} won the match!`
          : `Vince la sfida ${winner.name}!`
      );
    }

    const end = Date.now() + 3000;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
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
    <div className="h-[100dvh] max-h-[100dvh] w-full party-stage-bg flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-hidden touch-none">
      <div className="card-cream max-w-xl w-full rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 animate-pop-in">
        <div className="w-24 h-24 rounded-3xl bg-gold border-[3px] border-ink shadow-chunky flex items-center justify-center text-5xl animate-bounce-soft">
          <Trophy className="w-12 h-12 text-ink" />
        </div>

        <div>
          <span className="px-3.5 py-1 rounded-full bg-paper border-2 border-ink font-display font-bold text-xs uppercase text-ink">
            {isDraw
              ? language === 'en'
                ? 'Tie Match!'
                : 'Pareggio!'
              : language === 'en'
              ? 'Arena Champion'
              : 'Campione della partita'}
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink mt-3">
            {isDraw
              ? `${p1.avatar} ${language === 'en' ? 'Equal Points!' : 'Pari merito!'} ${p2.avatar}`
              : `${winner.avatar} ${winner.name}`}
          </h1>
          <p className="text-ink/70 font-semibold mt-1">
            {language === 'en' ? 'Final Score:' : 'Punteggio finale:'}{' '}
            <strong>
              {p1.name} {p1Score}
            </strong>{' '}
            —{' '}
            <strong>
              {p2Score} {p2.name}
            </strong>
          </p>
        </div>

        {/* Statistiche veloci */}
        <div className="w-full grid grid-cols-3 gap-3 bg-paper p-4 rounded-2xl border-2 border-ink">
          <div>
            <span className="text-xs font-bold text-ink/60 block">Rounds</span>
            <span className="font-display font-bold text-2xl text-ink">
              {history.length}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-p1 block">
              {language === 'en' ? `${p1.name} Photos` : `Foto ${p1.name}`}
            </span>
            <span className="font-display font-bold text-2xl text-ink">
              {totalP1Correct}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-p2 block">
              {language === 'en' ? `${p2.name} Photos` : `Foto ${p2.name}`}
            </span>
            <span className="font-display font-bold text-2xl text-ink">
              {totalP2Correct}
            </span>
          </div>
        </div>

        {/* Riepilogo Round giocati */}
        {history.length > 0 && (
          <div className="w-full max-h-40 overflow-y-auto flex flex-col gap-1.5 text-left pr-1">
            {history.map((h) => (
              <div
                key={`${h.roundNumber}-${h.categoryId}`}
                className="px-3.5 py-2 rounded-xl bg-white border border-ink/15 flex items-center justify-between text-xs font-semibold text-ink"
              >
                <span>
                  {h.categoryIcon} {h.categoryName}
                </span>
                <span
                  className={
                    h.winner === 'p1' ? 'text-p1 font-bold' : 'text-p2 font-bold'
                  }
                >
                  {h.winner === 'p1' ? p1.name : p2.name} ({h.winnerTimeLeft.toFixed(1)}s)
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={onPlayAgain}
            className="btn-push py-3.5 px-5 rounded-2xl bg-gold text-ink font-display font-bold text-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{language === 'en' ? 'Play Again' : 'Rivincita'}</span>
          </button>
          <button
            onClick={onBackToLobby}
            className="btn-push py-3.5 px-5 rounded-2xl bg-white text-ink font-display font-bold text-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>{language === 'en' ? 'Back to Lobby' : 'Torna al Menu'}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-ink/40 pt-1">
          v{APP_VERSION}
        </div>
      </div>
    </div>
  );
};
