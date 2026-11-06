import React, { useState, useEffect, useCallback } from 'react';
import {
  Shuffle,
  Grid,
  ArrowLeft,
  Trophy,
  Search,
  X,
  Flag,
} from 'lucide-react';
import {
  Category,
  DuelSummary,
  PlayerConfig,
  PlayerId,
  TargetWinsOption,
} from '../types/game';
import {
  getBackupImageUrl,
  preloadCategoryImages,
  primeImage,
} from '../data/categories';
import { gameConfig } from '../services/configService';
import { APP_VERSION } from '../config/version';
import { soundEngine } from '../engine/soundEffects';

interface CategoryDraftScreenProps {
  categories: Category[];
  playedCategoryIds: string[];
  p1: PlayerConfig;
  p2: PlayerConfig;
  p1Score: number;
  p2Score: number;
  targetWins: TargetWinsOption;
  chooserId: PlayerId;
  roundNumber: number;
  lastSummary: DuelSummary | null;
  onSelectCategory: (category: Category) => void;
  onFinishMatchEarly: () => void;
  onBackToLobby: () => void;
}

function pickFourRandom(
  all: Category[],
  playedIds: string[],
  excludeCurrentIds: string[] = []
): Category[] {
  const playedSet = new Set(playedIds);
  const excludeSet = new Set(excludeCurrentIds);

  const offeredCount = gameConfig.options.draftCardsCount;
  let pool = all.filter(
    (c) => !playedSet.has(c.id) && !excludeSet.has(c.id)
  );
  if (pool.length < offeredCount) {
    pool = all.filter((c) => !playedSet.has(c.id));
  }
  if (pool.length < offeredCount) {
    pool = [...all];
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, offeredCount);
}

export const CategoryDraftScreen: React.FC<CategoryDraftScreenProps> = ({
  categories,
  playedCategoryIds,
  p1,
  p2,
  p1Score,
  p2Score,
  targetWins,
  chooserId,
  roundNumber,
  lastSummary,
  onSelectCategory,
  onFinishMatchEarly,
  onBackToLobby,
}) => {
  const [offered, setOffered] = useState<Category[]>(() =>
    pickFourRandom(categories, playedCategoryIds)
  );
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chooser = chooserId === 'p1' ? p1 : p2;
  const opponent = chooserId === 'p1' ? p2 : p1;

  // Precarica e decodifica via GPU le copertine delle 4 carte proposte
  useEffect(() => {
    offered.forEach((cat) => {
      const cover = cat.coverImage || cat.items[0]?.imageUrl;
      if (cover) {
        primeImage(cover).catch(() => {});
      }
    });
  }, [offered]);

  // Conto alla rovescia 3 - 2 - 1 prima dell'inizio del duello
  useEffect(() => {
    if (countdown === null || !selectedCat) return;

    if (countdown > 0) {
      soundEngine.playCountdownBeep(false);
      const t = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 850);
      return () => clearTimeout(t);
    } else {
      soundEngine.playCountdownBeep(true);
      soundEngine.stopAnnouncements();
      const launch = setTimeout(() => {
        onSelectCategory(selectedCat);
      }, 420);
      return () => clearTimeout(launch);
    }
  }, [countdown, selectedCat, onSelectCategory]);

  const handleReroll = useCallback(() => {
    if (countdown !== null) return;
    soundEngine.playRandomizerStep(1.15);
    setOffered((prev) =>
      pickFourRandom(
        categories,
        playedCategoryIds,
        prev.map((c) => c.id)
      )
    );
  }, [categories, playedCategoryIds, countdown]);

  const handleChooseCard = (cat: Category) => {
    if (countdown !== null) return;
    setShowAllModal(false);
    preloadCategoryImages(cat, 20);
    soundEngine.playChallengeLocked();
    soundEngine.speakAnnouncement(`${cat.name}! Pronti al via!`);
    setSelectedCat(cat);
    setCountdown(3);
  };

  const filteredCatalog = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full party-stage-bg flex flex-col justify-between p-2.5 sm:p-4 md:p-6 select-none overflow-hidden touch-none">
      {/* Top Bar con Punteggio dei due Giocatori */}
      <header className="max-w-6xl w-full mx-auto flex flex-col gap-1.5 sm:gap-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onBackToLobby}
            className="btn-push px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-cream text-ink font-display font-bold text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </button>

          {/* Tabellone Punteggio Centrale */}
          <div className="card-cream rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-3 sm:gap-6 shadow-chunky-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl">{p1.avatar}</span>
              <span className="font-display font-bold text-xs sm:text-base text-ink max-w-[85px] sm:max-w-[110px] truncate">
                {p1.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-xl bg-p1 text-white font-display font-bold text-sm sm:text-lg border-2 border-ink">
                {p1Score}
              </span>
            </div>

            <div className="text-[10px] sm:text-xs font-display font-bold text-ink/50 uppercase">
              {targetWins > 0 ? `A ${targetWins}` : `Round ${roundNumber}`}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 rounded-xl bg-p2 text-white font-display font-bold text-sm sm:text-lg border-2 border-ink">
                {p2Score}
              </span>
              <span className="font-display font-bold text-xs sm:text-base text-ink max-w-[85px] sm:max-w-[110px] truncate">
                {p2.name}
              </span>
              <span className="text-xl sm:text-2xl">{p2.avatar}</span>
            </div>
          </div>

          {p1Score + p2Score > 0 ? (
            <button
              onClick={onFinishMatchEarly}
              className="btn-push px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gold text-ink font-display font-bold text-xs flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Concludi</span>
            </button>
          ) : (
            <div className="w-[84px] hidden sm:block" />
          )}
        </div>

        {/* Riepilogo dell'ultimo duello appena concluso */}
        {lastSummary && (
          <div className="max-w-3xl mx-auto w-full px-3 py-1.5 rounded-xl bg-[#2a2142] border border-gold/60 text-cream text-[11px] sm:text-xs flex items-center justify-center gap-1.5 text-center truncate">
            <Trophy className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="truncate">
              Punto a{' '}
              <strong className="text-gold">
                {lastSummary.winner === 'p1' ? p1.name : p2.name}
              </strong>{' '}
              ({lastSummary.categoryIcon} {lastSummary.categoryName}) con {lastSummary.winnerTimeLeft.toFixed(1)}s!
            </span>
          </div>
        )}
      </header>

      {/* Titolo Turno di Scelta */}
      <div className="max-w-4xl w-full mx-auto text-center my-1 sm:my-2 shrink-0">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 rounded-full border-2 sm:border-[3px] border-ink font-display font-bold text-xs sm:text-sm shadow-chunky-sm mb-1 ${
            chooserId === 'p1'
              ? 'bg-p1 text-white'
              : 'bg-p2 text-white'
          }`}
        >
          <span>Round {roundNumber}</span>
          <span>•</span>
          <span>Scelta categoria</span>
        </div>

        <h1 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-cream leading-tight">
          Tocca a <span className="text-gold">{chooser.avatar} {chooser.name}</span> scegliere!
        </h1>
        <p className="text-[10px] sm:text-xs text-cream/70 mt-0.5 line-clamp-1">
          Scegli una delle 4 categorie qui sotto per sfidare {opponent.name}
        </p>
      </div>

      {/* Le 4 Carte Categoria Proposte (Griglia 2x2 su mobile con foto dominanti, zero spazio bianco vuoto!) */}
      <main className="max-w-6xl w-full mx-auto my-1 flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch">
        {offered.map((cat) => {
          const cover = cat.coverImage || cat.items[0]?.imageUrl;
          return (
            <button
              key={cat.id}
              onClick={() => handleChooseCard(cat)}
              disabled={countdown !== null}
              className="group relative rounded-2xl sm:rounded-3xl border-2 sm:border-[3px] border-ink bg-[#1a1329] overflow-hidden text-left flex flex-col justify-between shadow-chunky transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover active:translate-y-1 animate-pop-in min-h-0"
            >
              {/* Copertina fotografica reale ad alto impatto (occupa tutto lo spazio libero in altezza!) */}
              <div className="relative flex-1 min-h-0 w-full bg-[#140e22] overflow-hidden flex items-center justify-center p-2">
                {cover && (
                  <>
                    <img
                      src={cover}
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-30 pointer-events-none"
                    />
                    <img
                      src={cover}
                      alt={cat.name}
                      decoding="async"
                      loading="eager"
                      onLoad={(e) => {
                        e.currentTarget.classList.remove('opacity-0');
                        e.currentTarget.classList.add('opacity-100');
                      }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = '1';
                          img.src = getBackupImageUrl(cover);
                        }
                      }}
                      className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-xl group-hover:scale-105 transition-all duration-300 drop-shadow-md opacity-0"
                    />
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#140e22] to-transparent pointer-events-none z-10" />

                {/* Icona giocosa nell'angolo */}
                <div className="absolute top-2 left-2 w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-cream border-2 border-ink shadow-sm flex items-center justify-center text-sm sm:text-lg z-20">
                  {cat.icon}
                </div>

                {/* Conteggio foto totali nel pool */}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-ink/85 text-cream text-[9px] sm:text-[10px] font-bold z-20 border border-cream/20 shadow-sm backdrop-blur-xs">
                  {cat.items.reduce((acc, it) => acc + (it.imageUrls?.length || 1), 0)} foto
                </span>
              </div>

              {/* Striscia Dati Compatta Elegante (Nessuno spazio bianco vuoto, proporzioni perfette) */}
              <div className="p-2 sm:p-2.5 shrink-0 bg-[#fffdf7] border-t-2 border-ink flex flex-col justify-between gap-1">
                <div>
                  <h2 className="font-display font-bold text-xs sm:text-base text-ink leading-tight truncate group-hover:text-p1 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-ink/70 mt-0.5 line-clamp-1 leading-tight">
                    {cat.subtitle}
                  </p>
                </div>

                <div
                  className={`w-full py-1 sm:py-1.5 px-2 rounded-lg sm:rounded-xl font-display font-bold text-[10px] sm:text-xs text-center border border-ink sm:border-2 transition-all leading-tight shadow-sm ${
                    chooserId === 'p1'
                      ? 'bg-p1 text-white group-hover:bg-blue-600'
                      : 'bg-p2 text-white group-hover:bg-red-600'
                  }`}
                >
                  Scegli questa →
                </div>
              </div>
            </button>
          );
        })}
      </main>

      {/* Azioni in basso: Cambia le 4 proposte oppure Apri tutto il mazzo */}
      <footer className="max-w-4xl w-full mx-auto mt-1 sm:mt-2 flex flex-col items-center gap-1 shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={handleReroll}
            disabled={countdown !== null}
            className="btn-push px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gold text-ink font-display font-bold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Altre 4 proposte</span>
          </button>

          <button
            onClick={() => setShowAllModal(true)}
            disabled={countdown !== null}
            className="btn-push px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-cream text-ink font-display font-bold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-p1" />
            <span>Tutte le {categories.length}</span>
          </button>
        </div>

        <span className="font-mono text-[9px] sm:text-[10px] text-cream/40">
          v{APP_VERSION}
        </span>
      </footer>

      {/* Finestra Scelta Libera da tutte le 36 categorie */}
      {showAllModal && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-cream max-w-4xl w-full max-h-[85vh] rounded-3xl flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-paper border-b-[3px] border-ink flex items-center justify-between gap-3">
              <h2 className="font-display font-bold text-xl text-ink">
                Tutte le Categorie ({categories.length})
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-white border-2 border-ink/25 text-sm text-ink focus:outline-none focus:border-p1"
                  />
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  className="p-2 rounded-xl bg-white border-2 border-ink text-ink hover:bg-p2 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[70vh]">
              {filteredCatalog.map((cat) => {
                const cover = cat.coverImage || cat.items[0]?.imageUrl;
                const alreadyPlayed = playedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleChooseCard(cat)}
                    className={`group p-2.5 rounded-2xl border-2 border-ink text-left flex items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-card-hover ${
                      alreadyPlayed
                        ? 'bg-paper/50 opacity-60'
                        : 'bg-white hover:bg-gold/15 shadow-chunky-sm'
                    }`}
                  >
                    {/* Thumbnail fotografico reale con sfondo d'atmosfera sfocato e badge emoji */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#181226] border-2 border-ink shrink-0 flex items-center justify-center">
                      {cover && (
                        <>
                          <img
                            src={cover}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-35 pointer-events-none"
                          />
                          <img
                            src={cover}
                            alt=""
                            decoding="async"
                            loading="lazy"
                            onLoad={(e) => {
                              e.currentTarget.classList.remove('opacity-0');
                              e.currentTarget.classList.add('opacity-100');
                            }}
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (!img.dataset.fallback) {
                                img.dataset.fallback = '1';
                                img.src = getBackupImageUrl(cover);
                              }
                            }}
                            className="relative z-10 max-w-full max-h-full object-contain p-1 group-hover:scale-105 transition-all duration-200 opacity-0"
                          />
                        </>
                      )}
                      <div className="absolute top-1 left-1 w-6 h-6 rounded-lg bg-cream/90 backdrop-blur-sm border border-ink flex items-center justify-center text-xs shadow-sm z-20">
                        {cat.icon}
                      </div>
                    </div>

                    {/* Dettagli tematici della categoria (zero spoiler sul nome dell'immagine) */}
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-sm text-ink truncate group-hover:text-p1 transition-colors">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-ink/65 line-clamp-1 font-medium mt-0.5">
                        {cat.subtitle}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-paper border border-ink/20 text-[10px] font-bold text-ink/75">
                          {cat.items.length} soggetti ({cat.items.reduce((acc, it) => acc + (it.imageUrls?.length || 1), 0)} foto)
                        </span>
                        {alreadyPlayed && (
                          <span className="text-[10px] font-bold text-p2">
                            • Già giocata
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overlay Conto alla Rovescia 3 - 2 - 1 - VIA! */}
      {selectedCat && countdown !== null && (
        <div className="fixed inset-0 z-50 bg-[#140e22]/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="card-cream max-w-lg w-full rounded-3xl p-8 text-center flex flex-col items-center gap-5 animate-pop-in">
            <div className="w-20 h-20 rounded-3xl bg-gold border-[3px] border-ink shadow-chunky-sm flex items-center justify-center text-5xl">
              {selectedCat.icon}
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Scelta di {chooser.name}
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink mt-1">
                {selectedCat.name}
              </h2>
              <p className="text-sm text-ink/70 mt-1">{selectedCat.subtitle}</p>
            </div>

            <div className="w-full py-3 px-4 rounded-2xl bg-paper border-2 border-ink/15 flex items-center justify-around">
              <div className="flex items-center gap-2 font-display font-bold text-p1">
                <span className="text-2xl">{p1.avatar}</span>
                <span>{p1.name}</span>
              </div>
              <span className="font-display font-bold text-ink/40">VS</span>
              <div className="flex items-center gap-2 font-display font-bold text-p2">
                <span>{p2.name}</span>
                <span className="text-2xl">{p2.avatar}</span>
              </div>
            </div>

            <div className="font-display font-bold text-6xl sm:text-7xl text-p2 animate-bounce">
              {countdown > 0 ? countdown : 'VIA!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
