import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Mic,
  FastForward,
  Check,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Flame,
  Zap,
  Crown,
  X,
  Target,
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
import { APP_VERSION } from '../config/version';

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

  const progressPercent = isFreeMode
    ? 100
    : Math.max(0, Math.min(100, (timeRemaining / settings.soloDurationSeconds) * 100));

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col justify-between party-stage-bg select-none p-3 sm:p-5">
      {/* Barra Superiore */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-p1 border-2 border-ink shadow-chunky-sm flex items-center justify-center text-xl sm:text-2xl">
            {player.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-cream truncate max-w-[120px] sm:max-w-[200px]">
                {player.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gold/90 text-ink text-[11px] font-extrabold uppercase tracking-wider">
                {t('solo.title', settings.language)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-cream/70 font-medium">
              <span>{category.icon} {category.name}</span>
              {initialPersonalBest > 0 && (
                <span className="text-gold font-bold flex items-center gap-0.5">
                  <Trophy className="w-3 h-3" />
                  {initialPersonalBest}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className={`btn-push px-3 py-1.5 sm:py-2 rounded-xl border-2 border-ink font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 ${
              isPaused ? 'bg-mint text-ink' : 'bg-paper text-ink'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}
            </span>
          </button>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="btn-push p-2 rounded-xl bg-paper/80 border-2 border-ink text-ink hover:bg-p2 hover:text-white"
            title={t('solo.finishEarly', settings.language)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Timer Bar & Streak Banner */}
      <section className="max-w-4xl w-full mx-auto my-2 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-cream font-display font-bold">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black tracking-tight">
              <span>⏱️</span>
              <span className={!isFreeMode && timeRemaining <= 10 ? 'text-p2 animate-pulse' : 'text-cream'}>
                {timeRemaining.toFixed(1)}s
              </span>
            </div>
            {isFreeMode && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-mint text-ink font-bold">
                {t('solo.durationFree', settings.language)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <div className="animate-pop-in px-3 py-1 rounded-xl bg-gold text-ink font-display font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 border-ink shadow-sm">
                {streak >= 5 ? <Crown className="w-4 h-4" /> : streak >= 3 ? <Zap className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                <span>STREAK x{streak}!</span>
              </div>
            )}
            <div className="text-right">
              <span className="text-xs text-cream/70 font-semibold block">{t('solo.correct', settings.language)}</span>
              <span className="text-2xl sm:text-3xl font-black text-mint">{totalCorrect}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!isFreeMode && (
          <div className="w-full h-3 sm:h-4 bg-ink/40 rounded-full border-2 border-cream/20 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                timeRemaining <= 10 ? 'bg-p2' : timeRemaining <= 20 ? 'bg-gold' : 'bg-mint'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </section>

      {/* Main Photo Stage (No scroll, max visibility) */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col items-center justify-center min-h-0 relative">
        <div className="w-full h-full max-h-[58vh] sm:max-h-[62vh] relative card-cream rounded-3xl p-2 sm:p-3 overflow-hidden flex items-center justify-center border-[3px] border-ink shadow-chunky">
          {/* Skeleton di caricamento veloce */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-paper/90 flex flex-col items-center justify-center gap-2 z-10 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-ink/10 flex items-center justify-center text-2xl">
                {category.icon}
              </div>
              <span className="font-display font-bold text-sm text-ink/60">
                {t('solo.loading', settings.language)}
              </span>
            </div>
          )}

          {/* Immagine con GPU acceleration */}
          <img
            src={displaySrc}
            alt={currentItem.answer}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (!usingBackupUrl) {
                setUsingBackupUrl(true);
              } else {
                brokenIdsRef.current.add(currentItem.id);
                advanceToNextImage();
              }
            }}
            className={`w-full h-full object-contain rounded-2xl transition-opacity duration-150 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Feedback Visivo Risposta Corretta */}
          {correctFlash && (
            <div className="absolute inset-0 z-20 bg-mint/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 animate-pop-in text-ink p-4">
              <div className="w-20 h-20 rounded-full bg-white border-[3px] border-ink flex items-center justify-center text-mint shadow-chunky-sm">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>
              <span className="font-display font-black text-2xl sm:text-4xl uppercase tracking-wide text-center">
                {correctFlash.answer}
              </span>
              {correctFlash.alias && correctFlash.alias.toLowerCase() !== correctFlash.answer.toLowerCase() && (
                <span className="text-xs font-bold text-ink/70">
                  (&ldquo;{correctFlash.alias}&rdquo;)
                </span>
              )}
            </div>
          )}

          {/* Feedback Visivo Penalità Passo */}
          {passPenaltyLeft > 0 && (
            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-p2 text-white font-display font-bold text-xs sm:text-sm border-2 border-ink shadow-sm animate-pulse">
              {t('solo.passPenaltyBadge', settings.language, { n: settings.passPenaltySeconds })}
            </div>
          )}

          {/* Badge Trascrizione Vocale Live */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-ink/80 backdrop-blur-sm text-white border border-white/20 text-xs font-semibold flex items-center gap-2 max-w-[80%] truncate shadow-sm">
              <div className="relative flex items-center justify-center shrink-0">
                <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-mint' : 'text-cream/50'}`} />
                {isListening && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-mint animate-ping"
                    style={{ opacity: Math.max(0.2, micVolume * 2) }}
                  />
                )}
              </div>
              <span className="truncate">
                {liveTranscript ? `“${liveTranscript}”` : t('lobby.testingMic', settings.language)}
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-black/60 text-white font-mono text-[11px] font-bold border border-white/20">
              #{itemIndex + 1}
            </div>
          </div>
        </div>
      </main>

      {/* Controlli Inferiori */}
      <footer className="max-w-4xl w-full mx-auto my-2 shrink-0 flex items-center justify-between gap-3">
        <button
          onClick={triggerPass}
          disabled={passPenaltyLeft > 0}
          className="btn-push flex-1 py-3.5 sm:py-4 px-4 rounded-2xl bg-p2 text-white font-display font-bold text-base sm:text-lg border-[3px] border-ink flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FastForward className="w-5 h-5" />
          <span>{t('arena.passButton', settings.language)}</span>
        </button>

        <button
          onClick={() => triggerCorrectGuess()}
          className="btn-push flex-1 py-3.5 sm:py-4 px-4 rounded-2xl bg-mint text-ink font-display font-black text-base sm:text-lg border-[3px] border-ink flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{t('solo.manualCorrect', settings.language)}</span>
        </button>
      </footer>

      {/* Modale Conferma Uscita Anticipata */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-[#140e24]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-cream max-w-sm w-full rounded-3xl p-6 text-center flex flex-col items-center gap-4 animate-pop-in border-[4px] border-ink">
            <div className="w-14 h-14 rounded-2xl bg-p2/20 border-2 border-ink flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-ink">
                {t('solo.exitConfirmTitle', settings.language)}
              </h3>
              <p className="text-xs text-ink/70 mt-1">
                {t('solo.exitConfirmDesc', settings.language)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn-push py-2.5 rounded-xl bg-paper border-2 border-ink text-ink font-display font-bold text-sm"
              >
                {t('solo.continueBtn', settings.language)}
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  finishTrainingSession();
                }}
                className="btn-push py-2.5 rounded-xl bg-p2 text-white font-display font-bold text-sm"
              >
                {t('solo.endNowBtn', settings.language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Risultati Fine Allenamento */}
      {summaryData && (
        <div className="fixed inset-0 z-50 bg-[#140e24]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-cream max-w-md w-full rounded-3xl p-6 text-center flex flex-col items-center gap-5 animate-pop-in border-[4px] border-ink shadow-chunky">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gold border-[3px] border-ink flex items-center justify-center text-4xl shadow-chunky-sm">
                {summaryData.isNewPersonalBest ? '👑' : '🎯'}
              </div>
              {summaryData.isNewPersonalBest && (
                <div className="absolute -top-3 -right-3 animate-bounce">
                  <Sparkles className="w-8 h-8 text-gold drop-shadow-md" />
                </div>
              )}
            </div>

            <div>
              {summaryData.isNewPersonalBest ? (
                <span className="px-3 py-1 rounded-full bg-gold text-ink font-display font-black text-xs uppercase tracking-wide border-2 border-ink inline-block mb-1">
                  {t('solo.newRecord', settings.language)}
                </span>
              ) : (
                <span className="text-xs font-bold text-ink/60 uppercase tracking-wide block mb-1">
                  {t('solo.completed', settings.language)}
                </span>
              )}
              <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
                {summaryData.categoryIcon} {summaryData.categoryName}
              </h2>
            </div>

            {/* Griglia Statistiche */}
            <div className="w-full grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-paper border-2 border-ink flex flex-col items-center">
                <span className="text-[11px] font-bold text-ink/60 uppercase">
                  {t('solo.correct', settings.language)}
                </span>
                <span className="font-display font-black text-2xl text-mint">
                  {summaryData.totalCorrect}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-paper border-2 border-ink flex flex-col items-center">
                <span className="text-[11px] font-bold text-ink/60 uppercase">
                  {t('solo.streak', settings.language)}
                </span>
                <span className="font-display font-black text-2xl text-gold">
                  {summaryData.bestStreak}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-paper border-2 border-ink flex flex-col items-center">
                <span className="text-[11px] font-bold text-ink/60 uppercase">
                  {t('solo.passes', settings.language)}
                </span>
                <span className="font-display font-black text-2xl text-p2">
                  {summaryData.totalPasses}
                </span>
              </div>
            </div>

            {/* Dettagli Record Precedente */}
            {summaryData.previousBest > 0 && (
              <p className="text-xs text-ink/70 font-semibold">
                {t('solo.previousBest', settings.language, { n: summaryData.previousBest })}
              </p>
            )}

            {/* Pulsanti Azione */}
            <div className="w-full flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleRestart}
                className="btn-push w-full py-3 px-4 rounded-xl bg-gold text-ink font-display font-black text-base flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{t('solo.playAgain', settings.language)}</span>
              </button>

              <button
                onClick={onBackToDraft}
                className="btn-push w-full py-2.5 px-4 rounded-xl bg-mint text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>{t('solo.changeCategory', settings.language)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onBackToLobby}
                className="text-xs font-bold text-ink/70 hover:text-ink pt-1"
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
