import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shuffle,
  Grid,
  ArrowLeft,
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
import { TheFloorBackground } from './TheFloorBackground';
import { ScorePips } from './ScorePips';

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

const CARD_COLORS = [
  'bg-yellow text-ink',
  'bg-blue text-white',
  'bg-red text-white',
  'bg-green text-ink',
];

const CARD_TILTS = [
  '-rotate-[1.5deg]',
  'rotate-1',
  'rotate-[1.5deg]',
  '-rotate-1',
];

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
  const [countdownPhase, setCountdownPhase] = useState<'card-scale' | 'full-countdown'>('card-scale');
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chooser = chooserId === 'p1' ? p1 : p2;

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

    if (countdown === 3 && countdownPhase === 'card-scale') {
      const scaleTimer = setTimeout(() => {
        setCountdownPhase('full-countdown');
      }, 300);
      return () => clearTimeout(scaleTimer);
    }

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
      }, 450);
      return () => clearTimeout(launch);
    }
  }, [countdown, countdownPhase, selectedCat, onSelectCategory]);

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
    setCountdownPhase('card-scale');
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

  const stageColor = chooserId === 'p1' ? 'p1' : 'p2';

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden touch-none">
      {/* Dynamic 96px Checkerboard Floor Background */}
      <TheFloorBackground stage={stageColor} />

      {/* Main Container: Max 1100px Centered */}
      <div className="w-full max-w-[1100px] mx-auto flex-1 flex flex-col justify-between py-2 min-h-0">
        {/* ============================================================== */}
        {/* TOP BAR: MENU (LEFT) | SCOREBOARD PILLS (CENTER) | QUIT (RIGHT)*/}
        {/* ============================================================== */}
        <header className="w-full flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToLobby}
            aria-label="Back to menu"
            className="btn-push px-4 py-2 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('draft.menu', language)}</span>
          </button>

          {/* Compact Scoreboard in Top Center: Two Pills */}
          {!isSolo && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* P1 Pill */}
              <div className="px-3.5 py-1.5 rounded-full bg-paper border-[3px] border-ink shadow-hard-sm flex items-center gap-2">
                <span className="text-xl shrink-0">{p1.avatar}</span>
                <span className="font-display font-black text-xs sm:text-sm text-ink truncate max-w-[80px] sm:max-w-[110px]">
                  {p1.name}
                </span>
                <ScorePips
                  score={p1Score}
                  targetWins={targetWins}
                  playerColor="blue"
                  size="sm"
                />
              </div>

              {/* P2 Pill */}
              <div className="px-3.5 py-1.5 rounded-full bg-paper border-[3px] border-ink shadow-hard-sm flex items-center gap-2">
                <span className="text-xl shrink-0">{p2.avatar}</span>
                <span className="font-display font-black text-xs sm:text-sm text-ink truncate max-w-[80px] sm:max-w-[110px]">
                  {p2.name}
                </span>
                <ScorePips
                  score={p2Score}
                  targetWins={targetWins}
                  playerColor="red"
                  size="sm"
                />
              </div>
            </div>
          )}

          {isSolo && (
            <div className="px-4 py-1.5 rounded-full bg-paper border-[3px] border-ink shadow-hard-sm flex items-center gap-2">
              <span className="text-xl">{p1.avatar}</span>
              <span className="font-display font-black text-sm text-ink">
                {p1.name}
              </span>
            </div>
          )}

          {!isSolo && (p1Score + p2Score > 0 || isParty) ? (
            <button
              type="button"
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

        {/* ============================================================== */}
        {/* RIBBON BANNER IN ACTIVE PLAYER'S COLOR (-1deg)                 */}
        {/* ============================================================== */}
        <div className="w-full text-center my-2 shrink-0">
          <div
            className={`inline-block px-6 py-2 rounded-2xl border-[3px] border-ink shadow-hard -rotate-1 font-display font-black text-lg sm:text-2xl uppercase tracking-wider ${
              chooserId === 'p1' ? 'bg-blue text-white' : 'bg-red text-white'
            }`}
          >
            {isSolo
              ? t('solo.chooseCategory', language)
              : t('draft.pickCategory', language, {
                  name: localizePlayerName(chooser.name, language),
                })}
          </div>

          {/* Party opponent selector if in party mode */}
          {isParty && partyPlayers.length > 2 && onSelectOpponent && (
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-paper font-bold">
                {t('party.selectOpponent', language)}:
              </span>
              <div className="flex items-center gap-1.5">
                {partyPlayers
                  .filter((p) => p.id !== chooser.id)
                  .map((p) => (
                    <button
                      key={`opp-${p.id}`}
                      type="button"
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

        {/* ============================================================== */}
        {/* 2X2 GRID OF CATEGORY CARDS (FLAT FILLS, TILT, ICON + TITLE)    */}
        {/* ============================================================== */}
        <main className="w-full max-w-3xl mx-auto my-auto grid grid-cols-2 gap-4 sm:gap-6 items-stretch relative min-h-0">
          {offered.map((cat, idx) => {
            const isChosen = selectedCat?.id === cat.id;
            const isOthers = selectedCat !== null && !isChosen;
            const colorClass = CARD_COLORS[idx % CARD_COLORS.length];
            const tiltClass = CARD_TILTS[idx % CARD_TILTS.length];

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleChooseCard(cat)}
                disabled={countdown !== null}
                className={`min-h-[190px] sm:min-h-[220px] p-5 sm:p-7 rounded-card border-[3px] border-ink shadow-hard flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all duration-300 ${colorClass} ${tiltClass} hover:rotate-0 hover:shadow-hard-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                  isChosen
                    ? 'scale-105 z-20 shadow-hard-lifted rotate-0'
                    : isOthers
                    ? 'opacity-0 scale-75 pointer-events-none'
                    : ''
                }`}
              >
                <span className="text-6xl sm:text-7xl select-none mb-1">
                  {cat.icon}
                </span>
                <h2 className="font-display font-black text-xl sm:text-2xl leading-tight">
                  {getCategoryTitle(cat, language)}
                </h2>
              </button>
            );
          })}
        </main>

        {/* ============================================================== */}
        {/* ACTIONS RIGHT UNDER THE GRID (CENTERED, NEVER PINNED TO BOTTOM)*/}
        {/* ============================================================== */}
        <div className="w-full max-w-md mx-auto flex items-center justify-center gap-3 my-2 shrink-0">
          <button
            type="button"
            onClick={handleReroll}
            disabled={countdown !== null}
            className="btn-push h-12 flex-1 px-4 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>{t('draft.shuffle', language)}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            disabled={countdown !== null}
            className="btn-push h-12 flex-1 px-4 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
          >
            <Grid className="w-4 h-4" />
            <span>{t('draft.allCategories', language)}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CATEGORY REVEAL + FULL-SCREEN COUNTDOWN (NO MODAL BOX!)        */}
      {/* ============================================================== */}
      {countdown !== null && selectedCat && countdownPhase === 'full-countdown' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/85 select-none animate-screen-shake-6px">
          {/* Category sticker above */}
          <div className="px-6 py-2 rounded-2xl bg-paper border-[3px] border-ink shadow-hard font-display font-black text-2xl sm:text-4xl text-ink inline-flex items-center gap-3 -rotate-2 mb-4 animate-starburst-pop">
            <span className="text-3xl sm:text-5xl">{selectedCat.icon}</span>
            <span>{getCategoryTitle(selectedCat, language)}</span>
          </div>

          {/* Giant Number / Starburst "GO!" */}
          {countdown > 0 ? (
            <div
              key={countdown}
              className="font-display font-black text-[28vh] sm:text-[38vh] leading-none text-paper drop-shadow-[6px_6px_0_#14121F] animate-countdown-slam"
            >
              {countdown}
            </div>
          ) : (
            <div className="relative flex items-center justify-center animate-starburst-pop">
              {/* Starburst SVG */}
              <svg
                viewBox="0 0 200 200"
                className="w-64 h-64 sm:w-96 sm:h-96 drop-shadow-[8px_8px_0_#14121F]"
              >
                <polygon
                  points="100,0 125,45 175,25 160,75 200,100 160,125 175,175 125,155 100,200 75,155 25,175 40,125 0,100 40,75 25,25 75,45"
                  fill="#FFC933"
                  stroke="#14121F"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute font-display font-black text-6xl sm:text-8xl text-ink -rotate-6">
                GO!
              </span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SEARCHABLE ALL CATEGORIES MODAL                                */}
      {/* ============================================================== */}
      {showAllModal && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
          <div className="card-paper max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-pop-in">
            <div className="p-4 bg-paper border-b-[3px] border-ink flex items-center justify-between gap-3">
              <h2 className="font-display font-black text-xl text-ink">
                {t('draft.allCategories', language)} ({filteredCatalog.length})
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
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  aria-label="Close"
                  className="btn-push w-9 h-9 rounded-xl bg-white text-ink flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredCatalog.map((cat) => (
                <button
                  key={`all-${cat.id}`}
                  type="button"
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
    </div>
  );
};
