import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Mic,
  FastForward,
  Check,
  Pause,
  Play,
  RotateCcw,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  Category,
  DuelItem,
  GameSettings,
  PlayerConfig,
  SoloTrainingSummary,
} from '../types/game';
import { evaluateVoiceInput } from '../engine/voiceMatcher';
import { SmartSpeechRecognizer } from '../engine/speechRecognition';
import { soundEngine } from '../engine/soundEffects';
import { hapticsService } from '../services/hapticsService';
import {
  getBackupImageUrl,
  isImageCached,
  prepareArenaDeck,
  primeImage,
} from '../data/categories';
import { gameConfig } from '../services/configService';
import { soloScoreService } from '../services/soloScoreService';
import { t } from '../services/i18n';

interface SoloTrainingScreenProps {
  category: Category;
  player: PlayerConfig;
  settings: GameSettings;
  onBackToDraft: () => void;
  onBackToLobby: () => void;
}

export const SoloTrainingScreen: React.FC<SoloTrainingScreenProps> = ({
  category,
  player,
  settings,
  onBackToDraft,
  onBackToLobby,
}) => {
  const isFreeMode = settings.soloDurationSeconds === 0;
  const initialDuration = isFreeMode ? 0 : settings.soloDurationSeconds;

  const [deck, setDeck] = useState<DuelItem[]>(() =>
    prepareArenaDeck(category.items)
  );
  const [itemIndex, setItemIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(
    isFreeMode ? 0 : settings.soloDurationSeconds
  );
  const [isPaused, setIsPaused] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [passPenaltyLeft, setPassPenaltyLeft] = useState(0);

  // Statistiche sessione
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalPasses, setTotalPasses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctFlash, setCorrectFlash] = useState<{
    answer: string;
    alias?: string;
  } | null>(null);

  // Microfono e riconoscimento
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);

  // Immagini e preloading
  const [usingBackupUrl, setUsingBackupUrl] = useState(false);
  const brokenIdsRef = useRef<Set<string>>(new Set());
  const resolvedUrlsRef = useRef<Map<string, string>>(new Map());

  // Record personale
  const [initialPersonalBest] = useState<number>(() =>
    soloScoreService.getSoloBest(category.id)
  );
  const [summaryData, setSummaryData] = useState<SoloTrainingSummary | null>(
    null
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);
  const ignoreVoiceUntilRef = useRef<number>(0);
  const lastSecondBeepRef = useRef<number>(-1);

  const currentItem = deck[itemIndex % deck.length];
  const displaySrc = usingBackupUrl
    ? getBackupImageUrl(currentItem.imageUrl)
    : resolvedUrlsRef.current.get(currentItem.id) || currentItem.imageUrl;

  const [imageLoaded, setImageLoaded] = useState(() =>
    isImageCached(displaySrc)
  );

  // Gestione stato sincronizzato via ref per event loop e timer
  const stateRef = useRef({
    timeRemaining,
    isPaused,
    sessionEnded,
    passPenaltyLeft,
    totalCorrect,
    totalPasses,
    streak,
    bestStreak,
    isFreeMode,
    correctFlash,
  });

  useEffect(() => {
    stateRef.current = {
      timeRemaining,
      isPaused,
      sessionEnded,
      passPenaltyLeft,
      totalCorrect,
      totalPasses,
      streak,
      bestStreak,
      isFreeMode,
      correctFlash,
    };
  });

  // Precarica l'immagine corrente
  useEffect(() => {
    const cached = isImageCached(displaySrc);
    setImageLoaded(cached);
    if (!cached) {
      primeImage(displaySrc)
        .then(() => setImageLoaded(true))
        .catch(() => {});
    }
  }, [displaySrc]);

  // Rolling preloader per le immagini successive
  useEffect(() => {
    const preloadCount = gameConfig.options.preloaderWindowSize;
    for (let offset = 1; offset <= preloadCount; offset++) {
      const candidate = deck[(itemIndex + offset) % deck.length];
      if (
        !candidate ||
        brokenIdsRef.current.has(candidate.id) ||
        isImageCached(candidate.imageUrl)
      ) {
        continue;
      }

      primeImage(candidate.imageUrl)
        .then(() => {
          resolvedUrlsRef.current.set(candidate.id, candidate.imageUrl);
        })
        .catch(() => {
          const backup = getBackupImageUrl(candidate.imageUrl);
          primeImage(backup)
            .then(() => {
              resolvedUrlsRef.current.set(candidate.id, backup);
            })
            .catch(() => {
              brokenIdsRef.current.add(candidate.id);
            });
        });
    }
  }, [deck, itemIndex]);

  // Passa all'immagine successiva
  const advanceToNextImage = useCallback(() => {
    setUsingBackupUrl(false);
    setItemIndex((prev) => {
      let next = prev + 1;
      let safety = 0;
      while (
        next < deck.length &&
        brokenIdsRef.current.has(deck[next].id) &&
        safety < deck.length
      ) {
        next++;
        safety++;
      }
      if (next >= deck.length) {
        setDeck(prepareArenaDeck(category.items));
        return 0;
      }
      return next;
    });
  }, [deck, category.items]);

  // Risposta corretta
  const triggerCorrectGuess = useCallback(
    (heardText?: string) => {
      const st = stateRef.current;
      if (
        st.sessionEnded ||
        st.isPaused ||
        st.passPenaltyLeft > 0 ||
        st.correctFlash !== null
      ) {
        return;
      }

      ignoreVoiceUntilRef.current =
        performance.now() + gameConfig.options.voiceCooldownMs;
      recognizerRef.current?.consumeCurrentBuffer();

      const newStreak = st.streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setTotalCorrect((c) => c + 1);

      soundEngine.playCorrectAnswer(newStreak);
      hapticsService.vibrateCorrect();

      if (heardText) {
        setLiveTranscript(heardText);
      }

      setCorrectFlash({
        answer: currentItem.answer,
        alias: heardText,
      });

      setTimeout(() => {
        setCorrectFlash(null);
        advanceToNextImage();
      }, gameConfig.options.correctFlashDurationMs);
    },
    [advanceToNextImage, currentItem.answer]
  );

  // Passo
  const triggerPass = useCallback(() => {
    const st = stateRef.current;
    if (st.sessionEnded || st.isPaused || st.passPenaltyLeft > 0) return;

    ignoreVoiceUntilRef.current =
      performance.now() + gameConfig.options.voiceCooldownMs;
    recognizerRef.current?.consumeCurrentBuffer();

    soundEngine.playPassPenalty();
    hapticsService.vibratePass();

    setStreak(0);
    setTotalPasses((p) => p + 1);

    if (!isFreeMode) {
      // Penalità tempo in modalità con timer
      setTimeRemaining((prev) =>
        Math.max(0, prev - settings.passPenaltySeconds)
      );
    }

    setPassPenaltyLeft(settings.passPenaltySeconds);
    advanceToNextImage();
  }, [
    isFreeMode,
    settings.passPenaltySeconds,
    advanceToNextImage,
  ]);

  // Fine sessione allenamento
  const finishTrainingSession = useCallback(() => {
    const st = stateRef.current;
    if (st.sessionEnded) return;

    setSessionEnded(true);
    recognizerRef.current?.stop();
    soundEngine.playTimeOutBuzzer();
    hapticsService.vibrateVictory();

    const finalCorrect = st.totalCorrect;
    const finalBest = Math.max(st.bestStreak, st.streak);
    const saveResult = soloScoreService.saveSoloBest(
      category.id,
      finalCorrect
    );

    if (saveResult.isNewBest && finalCorrect > 0) {
      setTimeout(() => {
        soundEngine.playGrandFanfare();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFE66D', '#FF6B6B', '#4ECDC4', '#2E294E'],
        });
      }, 250);
    }

    setSummaryData({
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      totalCorrect: finalCorrect,
      totalPasses: st.totalPasses,
      bestStreak: finalBest,
      durationSeconds: initialDuration,
      timeLeft: Math.max(0, st.timeRemaining),
      isNewPersonalBest: saveResult.isNewBest && finalCorrect > 0,
      previousBest: saveResult.previousBest,
    });
  }, [category, initialDuration]);

  // Restart rapido per riprovare la stessa categoria
  const handleRestart = () => {
    setDeck(prepareArenaDeck(category.items));
    setItemIndex(0);
    setTimeRemaining(isFreeMode ? 0 : settings.soloDurationSeconds);
    setIsPaused(false);
    setSessionEnded(false);
    setPassPenaltyLeft(0);
    setTotalCorrect(0);
    setTotalPasses(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectFlash(null);
    setSummaryData(null);
    setLiveTranscript('');
  };

  // Timer loop principale
  useEffect(() => {
    if (sessionEnded || isPaused) return;

    const interval = setInterval(() => {
      // Penalità visiva passo
      setPassPenaltyLeft((prev) => (prev > 0 ? Math.max(0, prev - 0.1) : 0));

      if (isFreeMode) {
        // Modalità libera: conta verso l'alto come cronometro
        setTimeRemaining((prev) => prev + 0.1);
      } else {
        // Modalità con conto alla rovescia
        setTimeRemaining((prev) => {
          const next = prev - 0.1;
          if (next <= 0) {
            clearInterval(interval);
            finishTrainingSession();
            return 0;
          }

          // Segnale sonoro per gli ultimi secondi
          const wholeSec = Math.ceil(next);
          if (wholeSec <= 5 && wholeSec > 0 && wholeSec !== lastSecondBeepRef.current) {
            lastSecondBeepRef.current = wholeSec;
            soundEngine.playClockTick(true);
          }

          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sessionEnded, isPaused, isFreeMode, finishTrainingSession]);

  // Riconoscimento Vocale
  useEffect(() => {
    if (sessionEnded || isPaused) {
      recognizerRef.current?.stop();
      return;
    }

    const rec = new SmartSpeechRecognizer(
      (alternatives) => {
        if (performance.now() < ignoreVoiceUntilRef.current) return;
        if (stateRef.current.sessionEnded || stateRef.current.isPaused) return;

        const bestTranscript = alternatives[0] || '';
        setLiveTranscript(bestTranscript);

        const matchResult = evaluateVoiceInput(
          alternatives,
          currentItem
        );

        if (matchResult.isPassCommand) {
          triggerPass();
          return;
        }

        if (matchResult.matched) {
          triggerCorrectGuess(matchResult.matchedAlias || bestTranscript);
        }
      },
      (listening, err) => {
        setIsListening(listening);
        if (err) setMicErrorMsg(err);
      },
      (vol) => setMicVolume(vol),
      settings.language || 'it'
    );

    recognizerRef.current = rec;
    rec.start();

    return () => {
      rec.stop();
    };
  }, [
    sessionEnded,
    isPaused,
    currentItem,
    settings.language,
    triggerCorrectGuess,
    triggerPass,
  ]);

  // Scorciatoie da tastiera (Spazio per Passo, Invio per Esatto)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionEnded) return;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerPass();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        triggerCorrectGuess();
      } else if (e.code === 'KeyP') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionEnded, triggerPass, triggerCorrectGuess]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-bg text-ink flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden touch-none">
      {/* 1. TOP BAR: Category name left, pause right */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-paper min-w-0">
          <span className="text-2xl sm:text-3xl shrink-0">{category.icon}</span>
          <h1 className="font-display font-black text-xl sm:text-2xl truncate">
            {category.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="btn-push px-4 py-1.5 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center gap-1.5"
            aria-label={isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}
          >
            {isPaused ? <Play className="w-4 h-4 text-green" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}</span>
          </button>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="btn-push p-1.5 px-2.5 rounded-xl bg-paper text-ink font-display font-bold text-sm"
            aria-label={t('solo.finishEarly', settings.language)}
            title={t('solo.finishEarly', settings.language)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN STAGE */}
      <main className="max-w-5xl w-full mx-auto my-auto flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6 min-h-0">
        {/* Single Player Card (Desktop: Left) */}
        <div className="hidden lg:flex w-52 p-5 rounded-card border-[3px] border-ink flex-col items-center justify-center gap-2 text-center bg-blue text-white shadow-hard">
          <span className="text-4xl">{player.avatar}</span>
          <span className="font-display font-bold text-lg truncate max-w-full">
            {player.name}
          </span>
          <span className="font-display font-black text-5xl tracking-tight my-1">
            {isFreeMode ? `${timeRemaining.toFixed(0)}s` : timeRemaining.toFixed(1)}
          </span>
          <span className="text-xs font-bold opacity-80">
            {totalCorrect} pts
          </span>
        </div>

        {/* Hero Photo: ~65% height on plain background, ONE frame only */}
        <div className="flex-1 min-h-0 w-full h-full max-h-[65vh] flex items-center justify-center relative">
          <div className="w-full h-full rounded-card border-[3px] border-ink shadow-hard overflow-hidden bg-black flex items-center justify-center relative">
            {/* Flash Correct Guess */}
            {correctFlash && (
              <div className="absolute inset-0 bg-green text-ink z-20 flex flex-col items-center justify-center p-6 text-center animate-pop-in">
                <div className="w-16 h-16 rounded-full bg-paper border-[3px] border-ink shadow-hard-sm flex items-center justify-center mb-3">
                  <Check className="w-9 h-9 text-green stroke-[3]" />
                </div>
                <h3 className="font-display font-black text-3xl sm:text-5xl">
                  {correctFlash.answer}
                </h3>
                {correctFlash.alias && correctFlash.alias.toLowerCase() !== correctFlash.answer.toLowerCase() && (
                  <span className="text-xs font-bold text-ink/70 mt-1">
                    (&ldquo;{correctFlash.alias}&rdquo;)
                  </span>
                )}
              </div>
            )}

            {/* 3s Pass Penalty Screen */}
            {!correctFlash && passPenaltyLeft > 0 && (
              <div className="absolute inset-0 bg-yellow text-ink z-20 flex flex-col items-center justify-center p-6 text-center animate-pop-in">
                <span className="font-display font-bold text-sm uppercase tracking-wider mb-1">
                  Pass! Answer:
                </span>
                <h3 className="font-display font-black text-2xl sm:text-4xl mb-3">
                  {currentItem.answer}
                </h3>
                <span className="font-display font-black text-5xl">
                  {passPenaltyLeft.toFixed(1)}s
                </span>
              </div>
            )}

            {/* The Photo */}
            {!correctFlash && passPenaltyLeft === 0 && (
              <img
                key={`${currentItem.id}-${usingBackupUrl ? 'b' : 'p'}`}
                src={displaySrc}
                alt={currentItem.answer}
                decoding="async"
                loading="eager"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  if (!usingBackupUrl) {
                    setUsingBackupUrl(true);
                  } else {
                    brokenIdsRef.current.add(currentItem.id);
                    advanceToNextImage();
                  }
                }}
                className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-100 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Player Card (Row directly below photo) */}
      <div className="w-full max-w-5xl mx-auto my-2 lg:hidden shrink-0">
        <div className="p-3 rounded-card border-[3px] border-ink flex items-center justify-between gap-2 bg-blue text-white shadow-hard">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{player.avatar}</span>
            <div className="min-w-0">
              <span className="font-display font-bold text-xs truncate block leading-tight">
                {player.name}
              </span>
              <span className="text-[10px] font-bold opacity-80 block">
                {totalCorrect} pts
              </span>
            </div>
          </div>
          <span className="font-display font-black text-2xl shrink-0">
            {isFreeMode ? `${timeRemaining.toFixed(0)}s` : timeRemaining.toFixed(1)}
          </span>
        </div>
      </div>

      {/* 3. BOTTOM ACTION BAR */}
      <div className="w-full max-w-5xl mx-auto shrink-0 card-paper p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            aria-label="Microphone"
            className={`w-11 h-11 rounded-xl border-[3px] border-ink shadow-hard-sm flex items-center justify-center shrink-0 ${
              isListening ? 'bg-green text-ink' : 'bg-paper text-ink'
            }`}
          >
            <Mic className="w-5 h-5 text-ink" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-display font-bold text-ink truncate">
              {liveTranscript ? (
                <span className="text-blue">“{liveTranscript}”</span>
              ) : isListening ? (
                settings.language === 'en' ? 'Say what you see or "Pass"...' : 'Di’ cosa vedi o "Passo"...'
              ) : micErrorMsg ? (
                <span className="text-red">{micErrorMsg}</span>
              ) : (
                settings.language === 'en' ? 'Microphone active' : 'Microfono attivo'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={triggerPass}
            disabled={passPenaltyLeft > 0 || correctFlash !== null}
            className="btn-push px-3.5 py-2 rounded-xl bg-paper text-ink font-display font-black text-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <FastForward className="w-4 h-4 inline mr-1" />
            <span>{isFreeMode ? t('arena.passButton', settings.language) : 'Pass (-3s)'}</span>
          </button>

          <button
            type="button"
            onClick={() => triggerCorrectGuess()}
            disabled={passPenaltyLeft > 0 || correctFlash !== null}
            className="btn-push px-4 py-2 rounded-xl bg-green text-ink font-display font-black text-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Check className="w-4 h-4 inline mr-1 stroke-[3]" />
            <span>{settings.language === 'en' ? 'Correct' : 'Buona'}</span>
          </button>
        </div>
      </div>

      {/* Desktop Keyboard Hints */}
      <div className="hidden lg:block text-center text-xs text-paper/40 font-medium mt-1">
        [Space] Pass • [Enter] Correct • [P] Pause
      </div>

      {/* Exit Confirm Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 animate-pop-in">
            <h3 className="font-display font-black text-2xl text-ink">
              {t('solo.exitConfirmTitle', settings.language)}
            </h3>
            <p className="text-sm font-sans text-ink/80">
              {t('solo.exitConfirmDesc', settings.language)}
            </p>
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn-push py-2.5 rounded-xl bg-paper border-[3px] border-ink text-ink font-display font-bold text-sm"
              >
                {t('solo.continueBtn', settings.language)}
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  finishTrainingSession();
                }}
                className="btn-push py-2.5 rounded-xl bg-yellow border-[3px] border-ink text-ink font-display font-black text-sm"
              >
                {t('solo.endNowBtn', settings.language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Results Modal */}
      {summaryData && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-md w-full p-6 text-center flex flex-col items-center gap-5 animate-pop-in">
            <div className="w-20 h-20 rounded-2xl bg-yellow border-[3px] border-ink shadow-hard flex items-center justify-center text-5xl">
              {summaryData.isNewPersonalBest ? '👑' : summaryData.categoryIcon}
            </div>

            <div>
              <span className="text-xs font-bold text-ink/60 uppercase tracking-wider block mb-1">
                {summaryData.isNewPersonalBest
                  ? t('solo.newRecord', settings.language)
                  : t('solo.completed', settings.language)}
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
                {summaryData.categoryName}
              </h2>
            </div>

            {/* Stats - clean, no nested outlined cards */}
            <div className="w-full flex items-center justify-around py-3 border-y-[3px] border-ink/20">
              <div className="text-center">
                <span className="text-xs font-bold text-ink/60 uppercase block">
                  {t('solo.correct', settings.language)}
                </span>
                <span className="font-display font-black text-3xl text-green">
                  {summaryData.totalCorrect}
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-ink/60 uppercase block">
                  {t('solo.streak', settings.language)}
                </span>
                <span className="font-display font-black text-3xl text-yellow">
                  {summaryData.bestStreak}
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-ink/60 uppercase block">
                  {t('solo.passes', settings.language)}
                </span>
                <span className="font-display font-black text-3xl text-red">
                  {summaryData.totalPasses}
                </span>
              </div>
            </div>

            {summaryData.previousBest > 0 && (
              <p className="text-xs font-sans text-ink/70 font-semibold">
                {t('solo.previousBest', settings.language, { n: summaryData.previousBest })}
              </p>
            )}

            <div className="w-full flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleRestart}
                className="btn-push w-full py-3 px-4 rounded-xl bg-yellow text-ink font-display font-black text-base flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{t('solo.playAgain', settings.language)}</span>
              </button>

              <button
                onClick={onBackToDraft}
                className="btn-push w-full py-2.5 px-4 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>{t('solo.changeCategory', settings.language)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onBackToLobby}
                className="text-xs font-sans font-bold text-ink/70 hover:text-ink pt-1"
              >
                {t('solo.backHome', settings.language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
