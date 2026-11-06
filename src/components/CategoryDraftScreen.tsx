import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  GameMode,
  PartyPlayer,
  PlayerConfig,
  PlayerId,
  TargetWinsOption,
  AppLanguage,
} from '../types/game';
import {
  preloadCategoryImages,
  primeImage,
} from '../data/categories';
import { gameConfig } from '../services/configService';
import { soundEngine } from '../engine/soundEffects';
import {
  t,
  getCategoryTitle,
  filterCategories,
  localizePlayerName,
} from '../services/i18n';

interface CategoryDraftScreenProps {
  categories: Category[];
  playedCategoryIds: string[];
  mode?: GameMode;
  p1: PlayerConfig;
  p2: PlayerConfig;
  partyPlayers?: PartyPlayer[];
  selectedOpponentId?: string;
  onSelectOpponent?: (id: string) => void;
  p1Score: number;
  p2Score: number;
  targetWins: TargetWinsOption;
  chooserId: PlayerId;
  roundNumber: number;
  language?: AppLanguage;
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
  mode = 'duel',
  p1,
  p2,
  partyPlayers = [],
  selectedOpponentId,
  onSelectOpponent,
  p1Score,
  p2Score,
  targetWins,
  chooserId,
  roundNumber,
  language = 'it',
  lastSummary,
  onSelectCategory,
  onFinishMatchEarly,
  onBackToLobby,
}) => {
  const isSolo = mode === 'solo';
  const isParty = mode === 'party';

  const availableCategories = useMemo(() => {
    return filterCategories(categories, language);
  }, [categories, language]);

  const [offered, setOffered] = useState<Category[]>(() =>
    pickFourRandom(filterCategories(categories, language), playedCategoryIds)
  );
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chooser = chooserId === 'p1' ? p1 : p2;
  const opponent = chooserId === 'p1' ? p2 : p1;

  useEffect(() => {
    offered.forEach((cat) => {
      const cover = cat.coverImage || cat.items[0]?.imageUrl;
      if (cover) {
        primeImage(cover).catch(() => {});
      }
    });
  }, [offered]);

  useEffect(() => {
    if (countdown === null || !selectedCat) return;

    if (countdown > 0) {
      soundEngine.playCountdownBeep(false);
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 850);
      return () => clearTimeout(timer);
    } else {
      soundEngine.playCountdownBeep(true);
      soundEngine.stopAnnouncements();
      const launch = setTimeout(() => {
        onSelectCategory(selectedCat);
      }, 400);
      return () => clearTimeout(launch);
    }
  }, [countdown, selectedCat, onSelectCategory]);

  const handleReroll = useCallback(() => {
    if (countdown !== null) return;
    soundEngine.playRandomizerStep(1.15);
    setOffered((prev) =>
      pickFourRandom(
        availableCategories,
        playedCategoryIds,
        prev.map((c) => c.id)
      )
    );
  }, [availableCategories, playedCategoryIds, countdown]);

  const handleChooseCard = (cat: Category) => {
    if (countdown !== null) return;
    setShowAllModal(false);
    preloadCategoryImages(cat, 20);
    soundEngine.playChallengeLocked();
    const catName = getCategoryTitle(cat, language);
    soundEngine.speakAnnouncement(
      language === 'en'
        ? `${catName}! Ready, set, go!`
        : `${catName}! Pronti al via!`
    );
    setSelectedCat(cat);
    setCountdown(3);
  };

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableCategories;
    return availableCategories.filter((c) => {
      const title = getCategoryTitle(c, language).toLowerCase();
      return title.includes(q) || c.name.toLowerCase().includes(q);
    });
  }, [availableCategories, searchQuery, language]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden touch-none">
      {/* Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between gap-3 shrink-0">
        <button
          onClick={onBackToLobby}
          aria-label="Back to menu"
          className="btn-push px-3.5 py-2 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        {/* Status in Center */}
        {isSolo ? (
          <div className="card-paper px-4 py-2 flex items-center gap-2">
            <span className="text-xl">{p1.avatar}</span>
            <span className="font-display font-bold text-sm text-ink">
              {p1.name}
            </span>
          </div>
        ) : (
          <div className="card-paper px-4 py-1.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{p1.avatar}</span>
              <span className="font-display font-bold text-sm text-ink truncate max-w-[90px]">
                {p1.name}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-blue text-white font-display font-bold text-sm border-2 border-ink">
                {p1Score}
              </span>
            </div>
            <span className="text-xs font-bold text-ink/40">•</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-red text-white font-display font-bold text-sm border-2 border-ink">
                {p2Score}
              </span>
              <span className="font-display font-bold text-sm text-ink truncate max-w-[90px]">
                {p2.name}
              </span>
              <span className="text-xl">{p2.avatar}</span>
            </div>
          </div>
        )}

        {!isSolo && (p1Score + p2Score > 0 || isParty) ? (
          <button
            onClick={onFinishMatchEarly}
            className="btn-push px-3.5 py-2 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4 text-red" />
            <span className="hidden sm:inline">{t('draft.finishEarly', language)}</span>
          </button>
        ) : (
          <div className="w-16" />
        )}
      </header>

      {/* Title & Chooser banner */}
      <div className="max-w-2xl w-full mx-auto text-center my-2 shrink-0">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-paper">
          {isSolo ? (
            t('solo.chooseCategory', language)
          ) : language === 'en' ? (
            <>{chooser.avatar} {localizePlayerName(chooser.name, language)}: choose category</>
          ) : (
            <>{chooser.avatar} {localizePlayerName(chooser.name, language)}: scegli categoria</>
          )}
        </h1>

        {isParty && partyPlayers.length > 2 && onSelectOpponent && (
          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-paper/80 font-bold">
              {t('party.selectOpponent', language)}:
            </span>
            <div className="flex items-center gap-1.5">
              {partyPlayers
                .filter((p) => p.id !== chooser.id)
                .map((p) => (
                  <button
                    key={`opp-${p.id}`}
                    onClick={() => onSelectOpponent(p.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-display font-bold border-[3px] border-ink transition-all ${
                      selectedOpponentId === p.id
                        ? 'bg-yellow text-ink shadow-hard-sm'
                        : 'bg-paper text-ink hover:bg-yellow/40'
                    }`}
                  >
                    {p.avatar} {p.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 4 Big Cards in a Grid: Icon + Title only (Descriptions hidden) */}
      <main className="max-w-2xl w-full mx-auto my-auto grid grid-cols-2 gap-4 items-stretch">
        {offered.map((cat) => {
          const isSelected = selectedCat?.id === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleChooseCard(cat)}
              disabled={countdown !== null}
              className={`p-6 sm:p-8 rounded-card border-[3px] border-ink flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-yellow shadow-hard translate-x-[2px] translate-y-[2px]'
                  : 'bg-paper shadow-hard hover:bg-yellow active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed'
              }`}
            >
              <span className="text-5xl sm:text-6xl select-none">{cat.icon}</span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-ink leading-tight">
                {getCategoryTitle(cat, language)}
              </h2>
            </button>
          );
        })}
      </main>

      {/* Bottom Actions */}
      <footer className="max-w-md w-full mx-auto flex items-center justify-center gap-3 shrink-0">
        <button
          onClick={handleReroll}
          disabled={countdown !== null}
          className="btn-push flex-1 py-3 px-4 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          <span>{t('draft.reroll', language)}</span>
        </button>

        <button
          onClick={() => setShowAllModal(true)}
          disabled={countdown !== null}
          className="btn-push flex-1 py-3 px-4 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
        >
          <Grid className="w-4 h-4" />
          <span>
            {language === 'en'
              ? `All (${availableCategories.length})`
              : `Tutte (${availableCategories.length})`}
          </span>
        </button>
      </footer>

      {/* Modal: All Categories List */}
      {showAllModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-pop-in">
            <div className="p-4 bg-paper border-b-[3px] border-ink flex items-center justify-between gap-3">
              <h2 className="font-display font-black text-xl text-ink">
                {language === 'en'
                  ? `Choose Category (${filteredCatalog.length})`
                  : `Scegli Categoria (${filteredCatalog.length})`}
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('draft.searchPlaceholder', language)}
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-white border-[3px] border-ink text-sm text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
                  />
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-xl bg-white border-[3px] border-ink flex items-center justify-center hover:bg-yellow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredCatalog.map((cat) => (
                <button
                  key={`all-${cat.id}`}
                  onClick={() => handleChooseCard(cat)}
                  className="p-3 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm hover:bg-yellow flex items-center gap-2.5 text-left transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <span className="text-2xl shrink-0">{cat.icon}</span>
                  <span className="font-display font-bold text-sm text-ink truncate">
                    {getCategoryTitle(cat, language)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Countdown Modal with Big Number (3 - 2 - 1 - GO!) - Preserved as requested */}
      {countdown !== null && selectedCat && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-8 text-center flex flex-col items-center gap-4 animate-pop-in">
            <span className="text-5xl">{selectedCat.icon}</span>
            <h2 className="font-display font-black text-2xl text-ink">
              {getCategoryTitle(selectedCat, language)}
            </h2>
            <div className="w-28 h-28 rounded-full bg-yellow border-[3px] border-ink shadow-hard flex items-center justify-center font-display font-black text-6xl text-ink">
              {countdown === 0 ? t('draft.countdownReady', language) : countdown}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
