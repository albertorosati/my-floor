import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { DuelSummary, PlayerConfig, PlayerId } from '../types/game';
import { soundEngine } from '../engine/soundEffects';

interface VictoryScreenProps {
  winnerId: PlayerId;
  p1: PlayerConfig;
  p2: PlayerConfig;
  history: DuelSummary[];
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winnerId,
  p1,
  p2,
  history,
  onPlayAgain,
  onBackToLobby,
}) => {
  const winner = winnerId === 'p1' ? p1 : p2;

  useEffect(() => {
    soundEngine.playDuelVictory();
    soundEngine.speakAnnouncement(
      `Dominio totale! ${winner.name} conquista l'intero pavimento di Floor Arena!`
    );

    const end = Date.now() + 3500;
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
  }, [winner.name]);

  const totalP1Correct = history.reduce((acc, h) => acc + h.p1Correct, 0);
  const totalP2Correct = history.reduce((acc, h) => acc + h.p2Correct, 0);

  return (
    <div className="min-h-screen studio-bg studio-grid-overlay flex flex-col items-center justify-center p-6 text-center select-none">
      <div
        className={`max-w-2xl w-full rounded-3xl p-8 md:p-10 border-4 flex flex-col items-center gap-6 ${
          winnerId === 'p1'
            ? 'bg-[#081930]/95 border-cyan-400 neon-cyan-box'
            : 'bg-[#290819]/95 border-rose-500 neon-pink-box'
        }`}
      >
        <div className="w-24 h-24 rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-5xl neon-gold-box animate-bounce">
          <Trophy className="w-12 h-12 text-amber-300" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="px-4 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            DOMINIO TOTALE DEL PAVIMENTO
          </span>
          <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-wider text-white mt-2">
            {winner.avatar} {winner.name}
          </h1>
          <p className="text-slate-300 text-base mt-1">
            Ha conquistato il 100% delle caselle di <strong>FLOOR ARENA</strong>!
          </p>
        </div>

        {/* Riepilogo Statistiche Partita */}
        <div className="w-full grid grid-cols-3 gap-3 bg-black/50 p-4 rounded-2xl border border-white/10">
          <div>
            <span className="text-xs font-mono text-slate-400 block">
              DUELLI GIOCATI
            </span>
            <span className="font-mono font-extrabold text-2xl text-amber-300">
              {history.length}
            </span>
          </div>
          <div>
            <span className="text-xs font-mono text-cyan-300 block">
              RISPOSTE {p1.name}
            </span>
            <span className="font-mono font-extrabold text-2xl text-white">
              {totalP1Correct}
            </span>
          </div>
          <div>
            <span className="text-xs font-mono text-rose-300 block">
              RISPOSTE {p2.name}
            </span>
            <span className="font-mono font-extrabold text-2xl text-white">
              {totalP2Correct}
            </span>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 font-display font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RIVINCITA SUBITO</span>
          </button>
          <button
            onClick={onBackToLobby}
            className="py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-display font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>TORNA ALLA LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
