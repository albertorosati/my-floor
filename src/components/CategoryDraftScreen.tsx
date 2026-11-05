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
} from '../data/categories';
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

  let pool = all.filter(
    (c) => !playedSet.has(c.id) && !excludeSet.has(c.id)
  );
  if (pool.length < 4) {
    pool = all.filter((c) => !playedSet.has(c.id));
  }
  if (pool.length < 4) {
    pool = [...all];
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 4);
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

  // Precarica le copertine delle 4 carte proposte
  useEffect(() => {
    offered.forEach((cat) => {
      if (cat.coverImage) {
        const img = new Image();
        img.src = cat.coverImage;
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
    <div className="min-h-screen party-stage-bg flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
      {/* Top Bar con Punteggio dei due Giocatori */}
      <header className="max-w-6xl w-full mx-auto flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBackToLobby}
            className="btn-push px-3.5 py-2 rounded-xl bg-cream text-ink font-display font-bold text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </button>

          {/* Tabellone Punteggio Centrale */}
          <div className="card-cream rounded-2xl px-4 py-2 flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p1.avatar}</span>
              <span className="font-display font-bold text-sm sm:text-base text-ink max-w-[110px] truncate">
                {p1.name}
              </span>
              <span className="px-3 py-0.5 rounded-xl bg-p1 text-white font-display font-bold text-lg border-2 border-ink">
                {p1Score}
              </span>
            </div>

            <div className="text-xs font-display font-bold text-ink/50 uppercase">
              {targetWins > 0 ? `A ${targetWins}` : `Round ${roundNumber}`}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-xl bg-p2 text-white font-display font-bold text-lg border-2 border-ink">
                {p2Score}
              </span>
              <span className="font-display font-bold text-sm sm:text-base text-ink max-w-[110px] truncate">
                {p2.name}
              </span>
              <span className="text-2xl">{p2.avatar}</span>
            </div>
          </div>

          {p1Score + p2Score > 0 ? (
            <button
              onClick={onFinishMatchEarly}
              className="btn-push px-3.5 py-2 rounded-xl bg-gold text-ink font-display font-bold text-xs flex items-center gap-1.5"
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
          <div className="max-w-3xl mx-auto w-full px-4 py-2.5 rounded-2xl bg-[#2a2142] border-2 border-gold/60 text-cream text-xs sm:text-sm flex flex-wrap items-center justify-center gap-2 text-center">
            <Trophy className="w-4 h-4 text-gold shrink-0" />
            <span>
              Round precedente (<strong>{lastSummary.categoryIcon} {lastSummary.categoryName}</strong>): punto a{' '}
              <strong className="text-gold">
                {lastSummary.winner === 'p1' ? p1.name : p2.name}
              </strong>{' '}
              con <strong>{lastSummary.winnerTimeLeft.toFixed(1)}s</strong> rimasti!
            </span>
          </div>
        )}
      </header>

      {/* Titolo Turno di Scelta */}
      <div className="max-w-4xl w-full mx-auto text-center my-4">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-[3px] border-ink font-display font-bold text-sm shadow-chunky-sm mb-3 ${
            chooserId === 'p1'
              ? 'bg-p1 text-white'
              : 'bg-p2 text-white'
          }`}
        >
          <span>Round {roundNumber}</span>
          <span>•</span>
          <span>Scelta categoria</span>
        </div>

        <h1 className="font-display text-2xl sm:text-4xl font-bold text-cream">
          Tocca a <span className="text-gold">{chooser.avatar} {chooser.name}</span> scegliere!
        </h1>
        <p className="text-sm text-cream/70 mt-1">
          Scegli una delle 4 categorie qui sotto per sfidare {opponent.name} (al prossimo giro sceglierà {opponent.name})
        </p>
      </div>

      {/* Le 4 Carte Categoria Proposte */}
      <main className="max-w-6xl w-full mx-auto my-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {offered.map((cat) => {
          const cover = cat.coverImage || cat.items[0]?.imageUrl;
          return (
            <button
              key={cat.id}
              onClick={() => handleChooseCard(cat)}
              disabled={countdown !== null}
              className="group card-cream rounded-3xl overflow-hidden text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-2 hover:shadow-card-hover active:translate-y-1 animate-pop-in"
            >
              {/* Copertina fotografica reale */}
              <div className="relative h-40 w-full bg-ink overflow-hidden border-b-[3px] border-ink">
                {cover && (
                  <img
                    src={cover}
                    alt={cat.name}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = '1';
                        img.src = getBackupImageUrl(cover);
                      }
                    }}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                {/* Icona giocosa nell'angolo */}
                <div className="absolute top-3 left-3 w-11 h-11 rounded-2xl bg-cream border-[2.5px] border-ink shadow-chunky-sm flex items-center justify-center text-2xl">
                  {cat.icon}
                </div>

                {/* Conteggio foto */}
                <span className="absolute bottom-2.5 right-3 px-2.5 py-0.5 rounded-full bg-ink/85 text-cream text-[11px] font-bold">
                  {cat.items.length} foto
                </span>
              </div>

              {/* Testo Carta */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-xl text-ink leading-snug group-hover:text-p1 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-ink/70 mt-1 line-clamp-2 leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>

                <div
                  className={`w-full py-2 px-3 rounded-xl font-display font-bold text-xs text-center border-2 border-ink transition-colors ${
                    chooserId === 'p1'
                      ? 'bg-p1Light text-ink group-hover:bg-p1 group-hover:text-white'
                      : 'bg-p2Light text-ink group-hover:bg-p2 group-hover:text-white'
                  }`}
                >
                  Scegli questa categoria →
                </div>
              </div>
            </button>
          );
        })}
      </main>

      {/* Azioni in basso: Cambia le 4 proposte oppure Apri tutto il mazzo */}
      <footer className="max-w-4xl w-full mx-auto mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleReroll}
          disabled={countdown !== null}
          className="btn-push px-5 py-3 rounded-2xl bg-gold text-ink font-display font-bold text-sm flex items-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          <span>Cambia le 4 proposte</span>
        </button>

        <button
          onClick={() => setShowAllModal(true)}
          disabled={countdown !== null}
          className="btn-push px-5 py-3 rounded-2xl bg-cream text-ink font-display font-bold text-sm flex items-center gap-2"
        >
          <Grid className="w-4 h-4 text-p1" />
          <span>Sfoglia tutte le {categories.length} categorie</span>
        </button>
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

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalog.map((cat) => {
                const alreadyPlayed = playedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleChooseCard(cat)}
                    className={`p-3.5 rounded-2xl border-2 border-ink text-left flex items-center gap-3 transition-all hover:-translate-y-0.5 ${
                      alreadyPlayed
                        ? 'bg-paper/60 opacity-65'
                        : 'bg-white hover:bg-gold/20 shadow-chunky-sm'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm text-ink truncate">
                        {cat.name}
                      </div>
                      <div className="text-[11px] font-semibold text-ink/60">
                        {cat.items.length} foto{' '}
                        {alreadyPlayed && '• Già giocata'}
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
