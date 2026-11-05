import React, { useState, useEffect } from 'react';
import {
  Swords,
  Sparkles,
  Dices,
  ArrowLeft,
  Trophy,
  Zap,
  Shield,
} from 'lucide-react';
import {
  DuelSummary,
  GridSizeOption,
  GridTile,
  PlayerConfig,
  PlayerId,
} from '../types/game';
import { soundEngine } from '../engine/soundEffects';
import { preloadCategoryImages } from '../data/categories';

interface FloorGridScreenProps {
  tiles: GridTile[];
  gridSize: GridSizeOption;
  p1: PlayerConfig;
  p2: PlayerConfig;
  activeTurn: PlayerId;
  lastSummary: DuelSummary | null;
  onChangeTurn: (turn: PlayerId) => void;
  onStartDuel: (challengedTile: GridTile) => void;
  onBackToLobby: () => void;
}

export const FloorGridScreen: React.FC<FloorGridScreenProps> = ({
  tiles,
  gridSize,
  p1,
  p2,
  activeTurn,
  lastSummary,
  onChangeTurn,
  onStartDuel,
  onBackToLobby,
}) => {
  const [randomizing, setRandomizing] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const cols = gridSize === '3x3' ? 3 : 4;
  const p1Tiles = tiles.filter((t) => t.owner === 'p1');
  const p2Tiles = tiles.filter((t) => t.owner === 'p2');
  const p1Percent = Math.round((p1Tiles.length / tiles.length) * 100);
  const p2Percent = 100 - p1Percent;

  const attacker = activeTurn === 'p1' ? p1 : p2;
  const defender = activeTurn === 'p1' ? p2 : p1;
  const defenderId: PlayerId = activeTurn === 'p1' ? 'p2' : 'p1';

  // Calcola quali caselle dell'avversario sono adiacenti (ortogonalmente o diagonalmente) al territorio dell'attaccante
  const attackableIndices = React.useMemo(() => {
    const attackerTiles = tiles.filter((t) => t.owner === activeTurn);
    const opponentTiles = tiles.filter((t) => t.owner === defenderId);

    const orthogonalSet = new Set<number>();
    for (const own of attackerTiles) {
      for (const opp of opponentTiles) {
        const dist =
          Math.abs(own.row - opp.row) + Math.abs(own.col - opp.col);
        if (dist === 1) {
          orthogonalSet.add(opp.index);
        }
      }
    }
    if (orthogonalSet.size > 0) return orthogonalSet;

    // Fallback: tutte le caselle avversarie se non ci sono adiacenze dirette
    return new Set(opponentTiles.map((t) => t.index));
  }, [tiles, activeTurn, defenderId]);

  // Gestione conto alla rovescia 3-2-1 automatico dopo aver scelto la casella da sfidare
  useEffect(() => {
    if (countdown === null || !selectedTile) return;

    if (countdown > 0) {
      soundEngine.playCountdownBeep(false);
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 900);
      return () => clearTimeout(timer);
    } else {
      soundEngine.playCountdownBeep(true);
      soundEngine.stopAnnouncements();
      const launchTimer = setTimeout(() => {
        onStartDuel(selectedTile);
      }, 450);
      return () => clearTimeout(launchTimer);
    }
  }, [countdown, selectedTile, onStartDuel]);

  const handleTileClick = (tile: GridTile) => {
    if (randomizing || countdown !== null) return;
    if (tile.owner === activeTurn) return;
    if (!attackableIndices.has(tile.index)) return;

    preloadCategoryImages(tile.category);
    soundEngine.playChallengeLocked();
    soundEngine.speakAnnouncement(
      `Sfida su ${tile.category.name}! Preparatevi!`
    );
    setSelectedTile(tile);
    setCountdown(3);
  };

  // Animazione "Randomizer" stile TV che sceglie casualmente una casella attaccabile
  const handleRunRandomizer = () => {
    if (randomizing || countdown !== null) return;
    const candidates = tiles.filter((t) => attackableIndices.has(t.index));
    if (candidates.length === 0) return;

    setRandomizing(true);
    let step = 0;
    const totalSteps = 18;

    const stepLoop = () => {
      const randomCandidate =
        candidates[Math.floor(Math.random() * candidates.length)];
      setSpotlightIndex(randomCandidate.index);
      soundEngine.playRandomizerStep(1 + step * 0.03);
      step++;

      if (step < totalSteps) {
        setTimeout(stepLoop, 75 + step * 10);
      } else {
        setRandomizing(false);
        setSpotlightIndex(randomCandidate.index);
        setTimeout(() => {
          handleTileClick(randomCandidate);
        }, 450);
      }
    };

    stepLoop();
  };

  return (
    <div className="min-h-screen studio-bg studio-grid-overlay flex flex-col justify-between p-4 md:p-6 select-none relative overflow-hidden">
      {/* Top Bar: Punteggio Territori & Controlli */}
      <header className="max-w-6xl w-full mx-auto flex flex-col gap-3 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-slate-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lobby</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              TURNO DI ATTACCO:
            </span>
            <button
              onClick={() =>
                onChangeTurn(activeTurn === 'p1' ? 'p2' : 'p1')
              }
              title="Clicca per cambiare chi ha l'iniziativa di attacco"
              className={`px-3.5 py-1.5 rounded-full font-display font-bold text-sm flex items-center gap-2 border transition-all ${
                activeTurn === 'p1'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 neon-cyan-box'
                  : 'bg-rose-500/20 border-rose-500 text-rose-200 neon-pink-box'
              }`}
            >
              <span>{attacker.avatar}</span>
              <span>{attacker.name}</span>
              <Swords className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRunRandomizer}
            disabled={randomizing || countdown !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-display font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
          >
            <Dices className="w-4 h-4" />
            <span>IL RANDOMIZER</span>
          </button>
        </div>

        {/* Barra di Dominio del Pavimento */}
        <div className="bg-[#070b18]/90 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-display font-bold">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="text-xl">{p1.avatar}</span>
              <span className="uppercase tracking-wider">{p1.name}</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 font-mono text-xs">
                {p1Tiles.length} CASELLE ({p1Percent}%)
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>CONQUISTA TUTTO IL PAVIMENTO PER VINCERE</span>
            </div>

            <div className="flex items-center gap-2 text-rose-300">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 font-mono text-xs">
                {p2Tiles.length} CASELLE ({p2Percent}%)
              </span>
              <span className="uppercase tracking-wider">{p2.name}</span>
              <span className="text-xl">{p2.avatar}</span>
            </div>
          </div>

          <div className="w-full h-3.5 rounded-full bg-slate-900 overflow-hidden flex p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-l-full transition-all duration-700"
              style={{ width: `${p1Percent}%` }}
            />
            <div
              className="h-full bg-gradient-to-l from-rose-600 to-rose-400 rounded-r-full transition-all duration-700"
              style={{ width: `${p2Percent}%` }}
            />
          </div>
        </div>

        {/* Banner esito ultimo duello */}
        {lastSummary && (
          <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-amber-200 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Ultimo Duello (<strong>{lastSummary.categoryName}</strong>): Vittoria di{' '}
                <strong>
                  {lastSummary.winner === 'p1' ? p1.name : p2.name}
                </strong>{' '}
                con <strong>{lastSummary.winnerTimeLeft.toFixed(1)}s</strong> residui!
              </span>
            </div>
            <span className="font-mono text-xs text-amber-300">
              Risposte esatte: {p1.name} {lastSummary.p1Correct} - {lastSummary.p2Correct} {p2.name}
            </span>
          </div>
        )}
      </header>

      {/* Istruzione contestuale al centro */}
      <div className="text-center my-2 z-10">
        <p className="text-sm md:text-base text-slate-300">
          Tocca a{' '}
          <strong
            className={
              activeTurn === 'p1' ? 'text-cyan-300' : 'text-rose-400'
            }
          >
            {attacker.avatar} {attacker.name}
          </strong>
          : clicca su una casella confinante di{' '}
          <strong
            className={
              activeTurn === 'p1' ? 'text-rose-400' : 'text-cyan-300'
            }
          >
            {defender.name}
          </strong>{' '}
          (con bordo lampeggiante) per sfidarlo nella sua categoria!
        </p>
      </div>

      {/* Griglia 3D Prospettica THE FLOOR */}
      <main className="max-w-5xl w-full mx-auto flex-1 flex items-center justify-center floor-perspective-wrapper my-2">
        <div
          className={`w-full floor-3d-plane grid gap-3 md:gap-4 p-4 md:p-6 rounded-3xl bg-[#050918]/90 border-2 border-indigo-500/30 shadow-2xl ${
            cols === 3 ? 'grid-cols-3 max-w-3xl' : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {tiles.map((tile) => {
            const isP1 = tile.owner === 'p1';
            const isAttackable = attackableIndices.has(tile.index);
            const isSpotlight = spotlightIndex === tile.index;

            return (
              <button
                key={tile.index}
                onClick={() => handleTileClick(tile)}
                disabled={!isAttackable || randomizing || countdown !== null}
                className={`group relative rounded-2xl p-3.5 md:p-5 flex flex-col justify-between min-h-[125px] md:min-h-[148px] text-left transition-all duration-300 border-2 overflow-hidden ${
                  isSpotlight
                    ? 'scale-105 border-yellow-300 neon-gold-box z-20'
                    : isP1
                    ? 'bg-gradient-to-br from-cyan-950/90 via-[#081b33] to-[#051020] border-cyan-400/60 neon-cyan-box'
                    : 'bg-gradient-to-br from-rose-950/90 via-[#2d091b] to-[#1a0510] border-rose-500/60 neon-pink-box'
                } ${
                  isAttackable
                    ? 'cursor-pointer hover:scale-[1.04] hover:border-yellow-300 ring-2 ring-yellow-400/50'
                    : 'opacity-85 cursor-default'
                }`}
              >
                {/* Riflesso luminoso superiore */}
                <div
                  className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
                    isP1 ? 'bg-cyan-400/25' : 'bg-rose-500/25'
                  }`}
                />

                {/* Riga Superiore: Proprietario + Badge Sfida */}
                <div className="flex items-center justify-between gap-1 z-10">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase ${
                      isP1
                        ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30'
                        : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                    }`}
                  >
                    <span>{isP1 ? p1.avatar : p2.avatar}</span>
                    <span className="truncate max-w-[85px]">
                      {isP1 ? p1.name : p2.name}
                    </span>
                  </span>

                  {isAttackable ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-mono font-extrabold text-[10px] uppercase flex items-center gap-1 animate-pulse">
                      <Swords className="w-3 h-3" />
                      SFIDA
                    </span>
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-white/30" />
                  )}
                </div>

                {/* Centro: Icona & Nome Categoria */}
                <div className="my-2 z-10">
                  <div className="text-3xl md:text-4xl mb-1 transform group-hover:scale-110 transition-transform">
                    {tile.category.icon}
                  </div>
                  <div className="font-display font-extrabold text-sm md:text-lg leading-tight text-white uppercase tracking-wide">
                    {tile.category.name}
                  </div>
                </div>

                {/* Riga Inferiore: Numero elementi */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
                  <span>{tile.category.items.length} immagini</span>
                  {tile.battlesCount > 0 && (
                    <span className="text-amber-300 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> {tile.battlesCount}x
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Overlay Cinematografico Pre-Duello (3... 2... 1... VIA!) */}
      {selectedTile && countdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-2xl w-full rounded-3xl bg-[#090f24] border-2 border-amber-400/70 neon-gold-box p-8 text-center flex flex-col items-center gap-6">
            <span className="px-4 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-xs uppercase tracking-widest font-bold">
              SFIDA UFFICIALE SUL PAVIMENTO
            </span>

            {/* Sfidanti VS */}
            <div className="w-full flex items-center justify-around gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-4xl">
                  {p1.avatar}
                </div>
                <span className="font-display font-bold text-lg text-cyan-300">
                  {p1.name}
                </span>
              </div>

              <div className="font-display font-black text-3xl md:text-5xl text-amber-400 italic">
                VS
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-4xl">
                  {p2.avatar}
                </div>
                <span className="font-display font-bold text-lg text-rose-300">
                  {p2.name}
                </span>
              </div>
            </div>

            {/* Categoria del Duello */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 w-full">
              <div className="text-5xl mb-2">{selectedTile.category.icon}</div>
              <h2 className="font-display font-black text-2xl md:text-4xl uppercase text-white tracking-wider">
                {selectedTile.category.name}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {selectedTile.category.subtitle}
              </p>
            </div>

            {/* Numero Countdown Gigante */}
            <div className="font-mono font-black text-6xl md:text-8xl text-amber-300 text-glow-gold animate-bounce">
              {countdown > 0 ? countdown : 'DUELLO!'}
            </div>
          </div>
        </div>
      )}

      {/* Footer Legenda */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 font-mono z-10">
        Chi vince il duello conquista i territori dell&apos;avversario!
      </footer>
    </div>
  );
};
