import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Mic,
  FastForward,
  Check,
  Pause,
  Play,
  Radio,
  ArrowRight,
} from 'lucide-react';
import {
  Category,
  DuelItem,
  DuelSummary,
  GameSettings,
  PlayerConfig,
  PlayerId,
  RemoteMicPacket,
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
import { t, localizePlayerName } from '../services/i18n';

interface DuelArenaScreenProps {
  roundNumber: number;
  category: Category;
  p1: PlayerConfig;
  p2: PlayerConfig;
  initialPlayer: PlayerId;
  settings: GameSettings;
  p2RemoteConnected: boolean;
  latestRemotePacket: RemoteMicPacket | null;
  onSendRemoteState: (packet: RemoteMicPacket) => void;
  onDuelFinished: (summary: DuelSummary) => void;
}

export const DuelArenaScreen: React.FC<DuelArenaScreenProps> = ({
  roundNumber,
  category,
  p1,
  p2,
  initialPlayer,
  settings,
  p2RemoteConnected,
  latestRemotePacket,
  onSendRemoteState,
  onDuelFinished,
}) => {
  const [deck, setDeck] = useState<DuelItem[]>(() =>
    prepareArenaDeck(category.items)
  );
  const [itemIndex, setItemIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState<PlayerId>(initialPlayer);

  const [timeP1, setTimeP1] = useState(settings.duelDurationSeconds);
  const [timeP2, setTimeP2] = useState(settings.duelDurationSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [passPenaltyLeft, setPassPenaltyLeft] = useState<number>(0);

  const [correctFlash, setCorrectFlash] = useState<{
    answer: string;
    byPlayer: PlayerId;
    isClutch?: boolean;
    streak?: number;
  } | null>(null);

  const [p1Correct, setP1Correct] = useState(0);
  const [p2Correct, setP2Correct] = useState(0);
  const [p1Passes, setP1Passes] = useState(0);
  const [p2Passes, setP2Passes] = useState(0);
  const [streak, setStreak] = useState(0);

  const [liveTranscript, setLiveTranscript] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  const [micListening, setMicListening] = useState(false);
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [usingBackupUrl, setUsingBackupUrl] = useState(false);

  // Sequenza di fine duello:
  const [duelFinishPhase, setDuelFinishPhase] = useState<'reveal' | 'winner' | null>(null);
  const [duelFinishData, setDuelFinishData] = useState<{
    winner: PlayerId;
    loser: PlayerId;
    lastItem: DuelItem;
    summary: DuelSummary;
  } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brokenIdsRef = useRef<Set<string>>(new Set());
  const resolvedUrlsRef = useRef<Map<string, string>>(new Map());

  const currentItem = deck[itemIndex % deck.length];
  const displaySrc = usingBackupUrl
    ? getBackupImageUrl(currentItem.imageUrl)
    : resolvedUrlsRef.current.get(currentItem.id) || currentItem.imageUrl;

  const [imageLoaded, setImageLoaded] = useState(() => isImageCached(displaySrc));

  // Precaricamento GPU
  useEffect(() => {
    const cached = isImageCached(displaySrc);
    setImageLoaded(cached);
    if (!cached) {
      primeImage(displaySrc)
        .then(() => {
          setImageLoaded(true);
        })
        .catch(() => {});
    }
  }, [displaySrc]);

  // Preloader rolling
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

  const stateRef = useRef({
    activePlayer,
    currentItem,
    isPaused,
    passPenaltyLeft,
    correctFlash,
    streak,
    timeP1,
    timeP2,
    p1Correct,
    p2Correct,
    p1Passes,
    p2Passes,
    duelEnded: false,
  });

  useEffect(() => {
    stateRef.current = {
      activePlayer,
      currentItem,
      isPaused,
      passPenaltyLeft,
      correctFlash,
      streak,
      timeP1,
      timeP2,
      p1Correct,
      p2Correct,
      p1Passes,
      p2Passes,
      duelEnded: stateRef.current.duelEnded,
    };
  });

  const ignoreVoiceUntilRef = useRef<number>(0);
  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);
  const lastSecondBeepRef = useRef<number>(-1);

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

  const triggerCorrectGuess = useCallback(
    (heardText?: string) => {
      const st = stateRef.current;
      if (
        st.duelEnded ||
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
      soundEngine.playCorrectAnswer(newStreak);
      hapticsService.vibrateCorrect();

      if (st.activePlayer === 'p1') {
        setP1Correct((c) => c + 1);
      } else {
        setP2Correct((c) => c + 1);
      }

      if (heardText) {
        setLiveTranscript(heardText);
      }

      const timeLeft = st.activePlayer === 'p1' ? st.timeP1 : st.timeP2;
      const isClutch = timeLeft <= 3.2;

      setCorrectFlash({
        answer: st.currentItem.answer,
        byPlayer: st.activePlayer,
        isClutch,
        streak: newStreak,
      });

      setTimeout(() => {
        if (stateRef.current.duelEnded) return;
        setCorrectFlash(null);
        setLiveTranscript('');
        setActivePlayer((prev) => (prev === 'p1' ? 'p2' : 'p1'));
        advanceToNextImage();
      }, gameConfig.options.correctFlashDurationMs);
    },
    [advanceToNextImage]
  );

  const triggerPass = useCallback(() => {
    const st = stateRef.current;
    if (
      st.duelEnded ||
      st.isPaused ||
      st.passPenaltyLeft > 0 ||
      st.correctFlash !== null
    ) {
      return;
    }

    ignoreVoiceUntilRef.current =
      performance.now() + gameConfig.options.voiceCooldownMs;
    recognizerRef.current?.consumeCurrentBuffer();

    soundEngine.playPassPenalty();
    hapticsService.vibratePass();
    setStreak(0);
    setLiveTranscript('Passo!');

    if (st.activePlayer === 'p1') {
      setP1Passes((p) => p + 1);
    } else {
      setP2Passes((p) => p + 1);
    }

    setPassPenaltyLeft(settings.passPenaltySeconds);
  }, [settings.passPenaltySeconds]);

  const processSpokenAlternatives = useCallback(
    (alternatives: string[], sourcePlayer?: PlayerId) => {
      const st = stateRef.current;
      if (
        st.duelEnded ||
        st.isPaused ||
        st.passPenaltyLeft > 0 ||
        st.correctFlash !== null
      ) {
        return;
      }

      if (performance.now() < ignoreVoiceUntilRef.current) {
        return;
      }

      if (
        settings.micMode === 'discord-p2p' &&
        p2RemoteConnected &&
        sourcePlayer &&
        sourcePlayer !== st.activePlayer
      ) {
        return;
      }

      if (alternatives[0]) {
        setLiveTranscript(alternatives[0]);
      }

      const matchResult = evaluateVoiceInput(alternatives, st.currentItem);
      if (matchResult.isPassCommand) {
        triggerPass();
      } else if (matchResult.matched) {
        triggerCorrectGuess(alternatives[0]);
      }
    },
    [settings.micMode, p2RemoteConnected, triggerPass, triggerCorrectGuess]
  );

  const processSpokenAlternativesRef = useRef(processSpokenAlternatives);
  processSpokenAlternativesRef.current = processSpokenAlternatives;

  const startMicSession = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setMicErrorMsg(null);
    const rec = new SmartSpeechRecognizer(
      (alternatives) => {
        processSpokenAlternativesRef.current(
          alternatives,
          stateRef.current.activePlayer
        );
      },
      (listening, err) => {
        setMicListening(listening);
        if (err) {
          setMicErrorMsg(err);
        } else if (listening) {
          setMicErrorMsg(null);
        }
      },
      (vol) => {
        setMicVolume(vol);
      },
      settings.language || 'it'
    );
    recognizerRef.current = rec;
    rec.start();
  }, [settings.language]);

  useEffect(() => {
    startMicSession();

    return () => {
      recognizerRef.current?.stop();
    };
  }, [startMicSession]);

  useEffect(() => {
    if (!latestRemotePacket) return;
    if (latestRemotePacket.type === 'TRANSCRIPT') {
      const alts =
        latestRemotePacket.alternatives &&
        latestRemotePacket.alternatives.length > 0
          ? latestRemotePacket.alternatives
          : latestRemotePacket.transcript
          ? [latestRemotePacket.transcript]
          : [];
      if (alts.length > 0) {
        processSpokenAlternatives(alts, 'p2');
      }
    } else if (latestRemotePacket.type === 'PASS_BUTTON') {
      if (stateRef.current.activePlayer === 'p2') {
        triggerPass();
      }
    } else if (
      latestRemotePacket.type === 'MIC_LEVEL' &&
      stateRef.current.activePlayer === 'p2'
    ) {
      setMicVolume(latestRemotePacket.micLevel || 0);
    }
  }, [latestRemotePacket, processSpokenAlternatives, triggerPass]);

  useEffect(() => {
    if (settings.micMode === 'discord-p2p' && p2RemoteConnected) {
      onSendRemoteState({
        type: 'STATE_UPDATE',
        activePlayer,
        p1Name: p1.name,
        p2Name: p2.name,
        categoryName: category.name,
        inDuel: true,
        timeLeftP2: timeP2,
      });
    }
  }, [
    activePlayer,
    timeP2,
    settings.micMode,
    p2RemoteConnected,
    p1.name,
    p2.name,
    category.name,
    onSendRemoteState,
  ]);

  const handleProceedToDraft = useCallback(() => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
    }
    soundEngine.stopAnnouncements();
    if (duelFinishData) {
      onDuelFinished(duelFinishData.summary);
    }
  }, [duelFinishData, onDuelFinished]);

  const handleTimeExpired = useCallback(
    (loser: PlayerId) => {
      const st = stateRef.current;
      if (st.duelEnded) return;
      st.duelEnded = true;

      recognizerRef.current?.stop();
      soundEngine.stopAnnouncements();

      const winner: PlayerId = loser === 'p1' ? 'p2' : 'p1';
      const summary: DuelSummary = {
        roundNumber,
        winner,
        loser,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        winnerTimeLeft: winner === 'p1' ? st.timeP1 : st.timeP2,
        p1Correct: st.p1Correct,
        p2Correct: st.p2Correct,
        p1Passes: st.p1Passes,
        p2Passes: st.p2Passes,
      };

      setDuelFinishData({
        winner,
        loser,
        lastItem: st.currentItem,
        summary,
      });

      setScreenShake(true);
      soundEngine.playTimeOutBuzzer();
      soundEngine.playRevealAnswer();
      soundEngine.speakAnnouncement(
        `Tempo scaduto! L'ultima risposta era: ${st.currentItem.answer}!`
      );
      setDuelFinishPhase('reveal');

      setTimeout(() => {
        setScreenShake(false);
      }, 550);

      setTimeout(() => {
        setDuelFinishPhase('winner');
        soundEngine.playGrandFanfare();
        soundEngine.playDuelVictory();
        hapticsService.vibrateVictory();

        const winPlayer = winner === 'p1' ? p1 : p2;
        const winName = localizePlayerName(winPlayer.name, settings.language);
        soundEngine.speakAnnouncement(
          t('arena.pointScoredAnnounce', settings.language, { name: winName })
        );

        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#FFC933', '#FF3D6E', '#2F6BFF', '#19C37D', '#FFFFFF'],
        });

        finishTimerRef.current = setTimeout(() => {
          onDuelFinished(summary);
        }, 3600);
      }, 2400);
    },
    [
      category.id,
      category.icon,
      category.name,
      onDuelFinished,
      p1,
      p2,
      roundNumber,
      settings.language,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (duelFinishPhase !== null) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleProceedToDraft();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        triggerPass();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        triggerCorrectGuess(stateRef.current.currentItem.answer);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerPass, triggerCorrectGuess, duelFinishPhase, handleProceedToDraft]);

  useEffect(() => {
    let lastTick = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      const st = stateRef.current;
      if (st.duelEnded || st.isPaused || st.correctFlash !== null) return;

      if (st.passPenaltyLeft > 0) {
        const nextPenalty = Math.max(0, st.passPenaltyLeft - dt);
        setPassPenaltyLeft(nextPenalty);
        if (nextPenalty === 0) {
          setLiveTranscript('');
          advanceToNextImage();
        }
      }

      if (st.activePlayer === 'p1') {
        const nextP1 = Math.max(0, st.timeP1 - dt);
        setTimeP1(nextP1);

        const wholeSec = Math.ceil(nextP1);
        if (wholeSec !== lastSecondBeepRef.current && nextP1 > 0) {
          lastSecondBeepRef.current = wholeSec;
          const isUrgent = nextP1 <= gameConfig.options.urgentThresholdSeconds;
          soundEngine.playClockTick(isUrgent);
          if (isUrgent) {
            hapticsService.vibrateUrgentTick();
          }
        }

        if (nextP1 <= 0) {
          handleTimeExpired('p1');
        }
      } else {
        const nextP2 = Math.max(0, st.timeP2 - dt);
        setTimeP2(nextP2);

        const wholeSec = Math.ceil(nextP2);
        if (wholeSec !== lastSecondBeepRef.current && nextP2 > 0) {
          lastSecondBeepRef.current = wholeSec;
          const isUrgent = nextP2 <= gameConfig.options.urgentThresholdSeconds;
          soundEngine.playClockTick(isUrgent);
          if (isUrgent) {
            hapticsService.vibrateUrgentTick();
          }
        }

        if (nextP2 <= 0) {
          handleTimeExpired('p2');
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [
    advanceToNextImage,
    handleTimeExpired,
  ]);

  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] w-full bg-bg text-ink flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden touch-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* 1. TOP BAR: Category name left, pause right */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-paper min-w-0">
          <span className="text-2xl sm:text-3xl shrink-0">{category.icon}</span>
          <h1 className="font-display font-black text-xl sm:text-2xl truncate">
            {category.name}
          </h1>
        </div>

        <button
          onClick={() => setIsPaused((p) => !p)}
          className="btn-push px-4 py-1.5 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center gap-1.5 shrink-0"
          aria-label={isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}
        >
          {isPaused ? <Play className="w-4 h-4 text-green" /> : <Pause className="w-4 h-4" />}
          <span>{isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}</span>
        </button>
      </header>

      {/* 2. MAIN DUEL STAGE */}
      <main className="max-w-5xl w-full mx-auto my-auto flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6 min-h-0">
        {/* Player 1 Card (Desktop: Left) */}
        <div
          className={`hidden lg:flex w-52 p-5 rounded-card border-[3px] border-ink flex-col items-center justify-center gap-2 text-center transition-all duration-100 ${
            activePlayer === 'p1'
              ? 'bg-blue text-white shadow-hard'
              : 'bg-paper text-ink opacity-60 shadow-hard'
          }`}
        >
          <span className="text-4xl">{p1.avatar}</span>
          <span className="font-display font-bold text-lg truncate max-w-full">
            {p1.name}
          </span>
          <span className="font-display font-black text-5xl tracking-tight my-1">
            {timeP1.toFixed(1)}
          </span>
          <span className="text-xs font-bold opacity-80">
            {p1Correct} pts
          </span>
        </div>

        {/* Hero Photo: ~65% height on plain background, ONE 3px ink outline + shadow */}
        <div className="flex-1 min-h-0 w-full h-full max-h-[65vh] flex items-center justify-center relative">
          <div className="w-full h-full rounded-card border-[3px] border-ink shadow-hard overflow-hidden bg-black flex items-center justify-center relative">
            {/* Reveal on timeout */}
            {duelFinishPhase === 'reveal' && duelFinishData && (
              <div className="absolute inset-0 bg-paper z-30 flex flex-col items-center justify-center p-6 text-center text-ink animate-pop-in">
                <span className="font-display font-bold text-sm text-ink/70 uppercase tracking-wider mb-2">
                  {settings.language === 'en' ? 'Time ran out! Answer was:' : 'Tempo scaduto! Era:'}
                </span>
                <h3 className="font-display font-black text-3xl sm:text-5xl text-ink">
                  {duelFinishData.lastItem.answer}
                </h3>
              </div>
            )}

            {/* Correct Flash */}
            {correctFlash && (
              <div className="absolute inset-0 bg-green text-ink z-20 flex flex-col items-center justify-center p-6 text-center animate-pop-in">
                <div className="w-16 h-16 rounded-full bg-paper border-[3px] border-ink shadow-hard-sm flex items-center justify-center mb-3">
                  <Check className="w-9 h-9 text-green stroke-[3]" />
                </div>
                <h3 className="font-display font-black text-3xl sm:text-5xl">
                  {correctFlash.answer}
                </h3>
              </div>
            )}

            {/* Pass Penalty (3s) */}
            {!correctFlash && passPenaltyLeft > 0 && (
              <div className="absolute inset-0 bg-yellow text-ink z-20 flex flex-col items-center justify-center p-6 text-center animate-pop-in">
                <span className="font-display font-bold text-sm uppercase tracking-wider mb-1">
                  {settings.language === 'en' ? 'Pass! Answer:' : 'Passo! Era:'}
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

        {/* Player 2 Card (Desktop: Right) */}
        <div
          className={`hidden lg:flex w-52 p-5 rounded-card border-[3px] border-ink flex-col items-center justify-center gap-2 text-center transition-all duration-100 ${
            activePlayer === 'p2'
              ? 'bg-red text-white shadow-hard'
              : 'bg-paper text-ink opacity-60 shadow-hard'
          }`}
        >
          <span className="text-4xl">{p2.avatar}</span>
          <span className="font-display font-bold text-lg truncate max-w-full">
            {p2.name}
          </span>
          <span className="font-display font-black text-5xl tracking-tight my-1">
            {timeP2.toFixed(1)}
          </span>
          <span className="text-xs font-bold opacity-80">
            {p2Correct} pts
          </span>
        </div>
      </main>

      {/* Mobile Player Cards (Row directly below photo) */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-5xl mx-auto my-2 lg:hidden shrink-0">
        <div
          className={`p-3 rounded-card border-[3px] border-ink flex items-center justify-between gap-2 transition-all ${
            activePlayer === 'p1'
              ? 'bg-blue text-white shadow-hard'
              : 'bg-paper text-ink opacity-60 shadow-hard'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{p1.avatar}</span>
            <div className="min-w-0">
              <span className="font-display font-bold text-xs truncate block leading-tight">
                {p1.name}
              </span>
              <span className="text-[10px] font-bold opacity-80 block">
                {p1Correct} pts
              </span>
            </div>
          </div>
          <span className="font-display font-black text-2xl shrink-0">
            {timeP1.toFixed(1)}
          </span>
        </div>

        <div
          className={`p-3 rounded-card border-[3px] border-ink flex items-center justify-between gap-2 transition-all ${
            activePlayer === 'p2'
              ? 'bg-red text-white shadow-hard'
              : 'bg-paper text-ink opacity-60 shadow-hard'
          }`}
        >
          <span className="font-display font-black text-2xl shrink-0">
            {timeP2.toFixed(1)}
          </span>
          <div className="flex items-center gap-2 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <span className="font-display font-bold text-xs truncate block leading-tight">
                {p2.name}
              </span>
              <span className="text-[10px] font-bold opacity-80 block">
                {p2Correct} pts
              </span>
            </div>
            <span className="text-2xl shrink-0">{p2.avatar}</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION BAR */}
      <div className="w-full max-w-5xl mx-auto shrink-0 card-paper p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={startMicSession}
            aria-label="Microphone"
            className={`w-11 h-11 rounded-xl border-[3px] border-ink shadow-hard-sm flex items-center justify-center shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
              micListening ? 'bg-green text-ink' : 'bg-paper text-ink'
            }`}
          >
            {settings.micMode === 'discord-p2p' &&
            activePlayer === 'p2' &&
            p2RemoteConnected ? (
              <Radio className="w-5 h-5 text-ink" />
            ) : (
              <Mic className="w-5 h-5 text-ink" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-display font-bold text-ink truncate">
              {liveTranscript ? (
                <span className="text-blue">“{liveTranscript}”</span>
              ) : micListening ? (
                settings.language === 'en' ? 'Say what you see or "Pass"...' : 'Di’ cosa vedi o "Passo"...'
              ) : micErrorMsg ? (
                <span className="text-red">{micErrorMsg}</span>
              ) : (
                settings.language === 'en' ? 'Tap mic to start' : 'Tocca il mic per iniziare'
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
            <span>Pass (-3s)</span>
          </button>

          <button
            type="button"
            onClick={() => triggerCorrectGuess(currentItem.answer)}
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

      {/* Round Winner Modal */}
      {duelFinishPhase === 'winner' && duelFinishData && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 animate-pop-in">
            <div className="w-20 h-20 rounded-2xl bg-yellow border-[3px] border-ink shadow-hard flex items-center justify-center text-5xl">
              {duelFinishData.winner === 'p1' ? p1.avatar : p2.avatar}
            </div>

            <div>
              <span className="text-xs font-bold text-ink/60 uppercase tracking-wider block mb-1">
                {t('arena.pointScoredTitle', settings.language)}
              </span>
              <h2 className="font-display font-black text-3xl text-ink">
                {localizePlayerName(
                  duelFinishData.winner === 'p1' ? p1.name : p2.name,
                  settings.language
                )}
              </h2>
            </div>

            <div className="w-full flex items-center justify-around py-3 border-y-[3px] border-ink/20">
              <div>
                <span className="text-xs text-ink/60 block">{t('arena.timeLeft', settings.language)}</span>
                <span className="font-display font-black text-2xl text-green">
                  {duelFinishData.summary.winnerTimeLeft.toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-xs text-ink/60 block">{t('arena.correctPhotos', settings.language)}</span>
                <span className="font-display font-black text-2xl text-ink">
                  {duelFinishData.winner === 'p1'
                    ? duelFinishData.summary.p1Correct
                    : duelFinishData.summary.p2Correct}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToDraft}
              className="btn-push w-full py-3.5 px-6 rounded-xl bg-yellow text-ink font-display font-black text-lg flex items-center justify-center gap-2 border-[3px] border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <span>{t('arena.chooseNextCategory', settings.language)}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 animate-pop-in">
            <h2 className="font-display font-black text-3xl text-ink">
              {t('arena.pausedTitle', settings.language)}
            </h2>
            <p className="text-sm font-sans text-ink/80">
              {t('arena.pausedDesc', settings.language)}
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="btn-push w-full py-3.5 rounded-xl bg-yellow text-ink font-display font-black text-lg border-[3px] border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {t('arena.resume', settings.language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
