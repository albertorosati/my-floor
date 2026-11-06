import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Mic,
  FastForward,
  Check,
  Pause,
  Play,
  Radio,
  AlertTriangle,
  Trophy,
  ArrowRight,
  Sparkles,
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
  getItemImagePool,
  isImageCached,
  prepareArenaDeck,
  primeImage,
} from '../data/categories';
import { gameConfig } from '../services/configService';
import { APP_VERSION } from '../config/version';

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

  // Sequenza di fine duello super animata:
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

  // Quando cambia l'immagine corrente, controlla se è già in cache GPU o ne forza la decodifica istantanea
  useEffect(() => {
    const cached = isImageCached(displaySrc);
    setImageLoaded(cached);
    if (!cached) {
      primeImage(displaySrc)
        .then(() => {
          setImageLoaded(true);
        })
        .catch(() => {
          // In caso di errore interverrà onError dell'elemento img
        });
    }
  }, [displaySrc]);

  // Preloader rolling: decodifica offscreen via GPU le prossime fotografie configurate
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
          // Prova subito il proxy WebP di emergenza
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
        // Passa sempre l'activePlayer corrente (funziona per entrambi i giocatori anche in single-screen!)
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
      }
    );
    recognizerRef.current = rec;
    rec.start();
  }, []);

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

      // 1. Schock visivo e svelamento dell'ultima risposta non data
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

      // 2. Dopo 2.4 secondi, passa alla celebrazione del vincitore
      setTimeout(() => {
        setDuelFinishPhase('winner');
        soundEngine.playGrandFanfare();
        soundEngine.playDuelVictory();
        hapticsService.vibrateVictory();

        const winPlayer = winner === 'p1' ? p1 : p2;
        soundEngine.speakAnnouncement(
          `Ha vinto ${winPlayer.name}! Punto conquistato!`
        );

        // Coriandoli e scintille dorate
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#FFB800', '#FF4757', '#2563EB', '#10B981', '#FFFFFF'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.7 },
            colors: ['#FFB800', '#FF007A', '#00F0FF'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.7 },
            colors: ['#FFB800', '#FF007A', '#00F0FF'],
          });
        }, 280);

        // 3. Procede alla selezione della categoria successiva
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
    category.id,
    category.icon,
    category.name,
    onDuelFinished,
    roundNumber,
  ]);

  const urgentLimit = gameConfig.options.urgentThresholdSeconds;
  const p1Urgent = activePlayer === 'p1' && timeP1 <= urgentLimit;
  const p2Urgent = activePlayer === 'p2' && timeP2 <= urgentLimit;
  const isUrgentNow = p1Urgent || p2Urgent;

  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] w-full party-stage-bg flex flex-col justify-between p-2.5 sm:p-4 md:p-6 select-none overflow-hidden touch-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Vignettatura Arcade Rosso Emergenza negli Ultimi 5 Secondi */}
      {isUrgentNow && !duelFinishPhase && (
        <div className="fixed inset-0 pointer-events-none z-30 ring-inset ring-[10px] sm:ring-[18px] ring-p2/50 animate-emergency" />
      )}

      {/* Barra Superiore: Categoria & Pausa */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gold border-[2.5px] border-ink shadow-chunky-sm flex items-center justify-center text-xl sm:text-2xl shrink-0">
            {category.icon}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-cream/60 block leading-tight">
              Round {roundNumber}
            </span>
            <h1 className="font-display font-bold text-base sm:text-2xl text-cream leading-tight truncate">
              {category.name}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsPaused((p) => !p)}
          className="btn-push px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-cream text-ink font-display font-bold text-xs flex items-center gap-1.5 shrink-0"
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mint" />
              <span>Riprendi</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink" />
              <span>Pausa</span>
            </>
          )}
        </button>
      </header>

      {/* Barra Cronometri Mobile (Visibili entrambi fianco a fianco, zero scroll verticale!) */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-6xl mx-auto my-1 lg:hidden shrink-0">
        {/* P1 Compact Card Mobile */}
        <div
          className={`p-2 rounded-2xl border-2 border-ink flex items-center justify-between gap-2 transition-all duration-150 ${
            activePlayer === 'p1'
              ? p1Urgent
                ? 'bg-p2 text-white shadow-chunky-sm scale-[1.01] animate-pulse ring-2 ring-white/50'
                : 'bg-p1 text-white shadow-chunky-sm scale-[1.01]'
              : 'bg-cream/90 text-ink opacity-65'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-2xl shrink-0">{p1.avatar}</span>
            <div className="min-w-0">
              <div className="font-display font-bold text-xs truncate leading-tight">
                {p1.name}
              </div>
              <div className="text-[10px] font-bold opacity-85">
                ✓ {p1Correct}
              </div>
            </div>
          </div>
          <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight shrink-0">
            {timeP1.toFixed(1)}
          </div>
        </div>

        {/* P2 Compact Card Mobile */}
        <div
          className={`p-2 rounded-2xl border-2 border-ink flex items-center justify-between gap-2 transition-all duration-150 ${
            activePlayer === 'p2'
              ? p2Urgent
                ? 'bg-p2 text-white shadow-chunky-sm scale-[1.01] animate-pulse ring-2 ring-white/50'
                : 'bg-p2 text-white shadow-chunky-sm scale-[1.01]'
              : 'bg-cream/90 text-ink opacity-65'
          }`}
        >
          <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight shrink-0">
            {timeP2.toFixed(1)}
          </div>
          <div className="flex items-center gap-1.5 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <div className="font-display font-bold text-xs truncate leading-tight">
                {p2.name}
              </div>
              <div className="text-[10px] font-bold opacity-85">
                ✓ {p2Correct}
              </div>
            </div>
            <span className="text-2xl shrink-0">{p2.avatar}</span>
          </div>
        </div>
      </div>

      {/* Palco Centrale: Timer P1 Desktop | Grande Cornice Fotografica Responsiva | Timer P2 Desktop */}
      <main className="max-w-6xl w-full mx-auto my-1 sm:my-2 flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 lg:items-center">
        {/* Blocco Cronometro Giocatore 1 (Desktop) */}
        <div
          className={`hidden lg:flex lg:col-span-3 rounded-3xl border-[3px] border-ink p-5 flex-col items-center gap-3 transition-all duration-200 ${
            activePlayer === 'p1'
              ? p1Urgent
                ? 'bg-p2 text-white shadow-chunky-lg scale-[1.03] animate-pulse'
                : 'bg-p1 text-white shadow-chunky-lg scale-[1.03]'
              : 'bg-cream/90 text-ink opacity-60 shadow-chunky-sm'
          }`}
        >
          <span className="text-4xl">{p1.avatar}</span>
          <h2 className="font-display font-bold text-xl truncate max-w-full">
            {p1.name}
          </h2>
          {activePlayer === 'p1' && (
            <span className="px-3 py-0.5 rounded-full bg-gold text-ink border-2 border-ink font-display font-bold text-xs">
              Tocca a te!
            </span>
          )}

          <div className="font-mono font-extrabold text-5xl sm:text-6xl tracking-tight my-1">
            {timeP1.toFixed(1)}
          </div>

          <div className="w-full h-3 bg-black/25 rounded-full overflow-hidden border border-black/20">
            <div
              className="h-full bg-gold transition-all duration-100"
              style={{
                width: `${(timeP1 / settings.duelDurationSeconds) * 100}%`,
              }}
            />
          </div>

          <div className="text-xs font-bold opacity-85">
            Indovinate: {p1Correct}
          </div>
        </div>

        {/* Cornice Centrale della Fotografia Vera (Occupa tutto lo spazio libero in altezza senza scroll!) */}
        <div className="flex-1 min-h-0 w-full lg:col-span-6 flex flex-col h-full justify-center relative">
          {/* Badge Arcade Combo Multiplier Fluttuante */}
          {streak >= 2 && !correctFlash && passPenaltyLeft === 0 && !duelFinishPhase && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 animate-combo-pop pointer-events-none">
              <div
                className={`px-3.5 py-1 rounded-full border-2 border-ink font-display font-black text-xs sm:text-sm tracking-wide shadow-chunky-sm flex items-center gap-1.5 ${
                  streak >= 5
                    ? 'bg-gradient-to-r from-gold via-mint to-gold text-ink animate-bounce'
                    : streak >= 3
                    ? 'bg-gradient-to-r from-gold to-p2 text-white animate-pulse'
                    : 'bg-gold text-ink'
                }`}
              >
                <span>{streak >= 5 ? '👑' : streak >= 3 ? '⚡' : '🔥'}</span>
                <span>
                  {streak >= 5
                    ? `GOD MODE x${streak}!`
                    : streak >= 3
                    ? `ON FIRE x${streak}!`
                    : `COMBO x${streak}`}
                </span>
              </div>
            </div>
          )}

          <div
            className={`relative w-full flex-1 min-h-0 rounded-2xl sm:rounded-3xl border-[3px] sm:border-[4px] border-ink shadow-chunky-lg overflow-hidden flex items-center justify-center transition-all duration-200 ${
              streak >= 3 ? 'animate-fire-aura' : ''
            } ${
              correctFlash
                ? 'bg-mint'
                : passPenaltyLeft > 0
                ? 'bg-gold'
                : 'bg-[radial-gradient(circle,#ffffff_0%,#f7f2e7_68%,#e6decb_100%)]'
            }`}
          >
            {/* Schermata Svelamento Ultima Risposta non data a tempo scaduto */}
            {duelFinishPhase === 'reveal' && duelFinishData && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-reveal-pop">
                <div className="px-4 py-1.5 rounded-full bg-p2 text-white border-[2.5px] border-ink font-display font-bold text-xs uppercase tracking-wider shadow-chunky-sm mb-2.5 flex items-center gap-1.5 animate-bounce">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tempo Scaduto!</span>
                </div>
                <span className="text-xs uppercase tracking-widest font-bold text-cream/70 mb-1">
                  L’ultima risposta corretta era:
                </span>
                <h3 className="font-display font-black text-2xl sm:text-4xl text-gold drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] max-w-lg leading-tight animate-reveal-pop">
                  {duelFinishData.lastItem.answer}
                </h3>
                <div className="mt-3 px-4 py-1.5 rounded-xl bg-white/10 text-cream/90 text-xs font-semibold backdrop-blur-sm border border-white/15">
                  Assegnazione vittoria in corso...
                </div>
              </div>
            )}

            {/* Flash Risposta Indovinata con Badge Clutch e Streak */}
            {correctFlash && (
              <div className="p-4 sm:p-6 text-center text-ink flex flex-col items-center gap-2 sm:gap-2.5 animate-pop-in z-20">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cream border-[3px] border-ink flex items-center justify-center shadow-chunky-sm">
                  <Check className="w-8 h-8 sm:w-9 sm:h-9 text-mint stroke-[3]" />
                </div>
                {correctFlash.isClutch && (
                  <span className="px-3 py-0.5 rounded-full bg-p2 text-white border-2 border-ink font-display font-black text-xs uppercase tracking-wider animate-bounce shadow-sm">
                    🎯 CLUTCH GUESS! SUL FILO DEL RASOIO!
                  </span>
                )}
                {correctFlash.streak && correctFlash.streak >= 2 && !correctFlash.isClutch && (
                  <span className="px-3 py-0.5 rounded-full bg-gold text-ink border-2 border-ink font-display font-black text-xs uppercase tracking-wider shadow-sm">
                    🔥 COMBO x{correctFlash.streak}!
                  </span>
                )}
                <span className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider">
                  Esatto!
                </span>
                <h3 className="font-display font-bold text-2xl sm:text-4xl">
                  {correctFlash.answer}
                </h3>
              </div>
            )}

            {/* Schermata 3 Secondi dopo aver detto PASSO */}
            {!correctFlash && passPenaltyLeft > 0 && (
              <div className="p-4 sm:p-6 text-center text-ink flex flex-col items-center gap-2 z-20 animate-pop-in">
                <span className="font-display font-bold text-xs sm:text-sm uppercase">
                  Passo! Era:
                </span>
                <h3 className="font-display font-bold text-2xl sm:text-4xl">
                  {currentItem.answer}
                </h3>
                <div className="mt-1 sm:mt-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-cream border-[3px] border-ink font-mono font-extrabold text-3xl sm:text-4xl shadow-chunky-sm">
                  {passPenaltyLeft.toFixed(1)}s
                </div>
              </div>
            )}

            {/* Fotografia Reale HD su passepartout chiaro (visibilità 100% sia per foto piene sia per PNG trasparenti!) */}
            {!correctFlash && passPenaltyLeft === 0 && (
              <>
                <img
                  src={displaySrc}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover blur-3xl scale-110 pointer-events-none transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-25' : 'opacity-0'
                  }`}
                />

                {/* Shimmer / Skeleton fluido prima della comparsa (zero scanlines o rendering a fette progressivo) */}
                {!imageLoaded && (
                  <div className="absolute inset-4 rounded-2xl bg-black/5 animate-pulse flex flex-col items-center justify-center gap-3 z-0 pointer-events-none">
                    <div className="w-10 h-10 rounded-full border-4 border-ink/20 border-t-ink animate-spin" />
                    <span className="font-display font-semibold text-xs text-ink/40 tracking-wider uppercase">
                      Caricamento foto...
                    </span>
                  </div>
                )}

                <div className="relative z-10 w-full h-full p-2.5 sm:p-4 flex items-center justify-center">
                  <img
                    key={`${currentItem.id}-${usingBackupUrl ? 'b' : 'p'}`}
                    src={displaySrc}
                    alt="Cosa vedi nella foto?"
                    decoding="async"
                    loading="eager"
                    onLoad={() => {
                      setImageLoaded(true);
                    }}
                    onError={() => {
                      if (!usingBackupUrl) {
                        setUsingBackupUrl(true);
                      } else {
                        brokenIdsRef.current.add(currentItem.id);
                        advanceToNextImage();
                      }
                    }}
                    className={`max-w-full max-h-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl drop-shadow-[0_10px_22px_rgba(24,18,38,0.22)] transition-all duration-200 ease-out ${
                      imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Blocco Cronometro Giocatore 2 (Desktop) */}
        <div
          className={`hidden lg:flex lg:col-span-3 rounded-3xl border-[3px] border-ink p-5 flex-col items-center gap-3 transition-all duration-200 ${
            activePlayer === 'p2'
              ? p2Urgent
                ? 'bg-p2 text-white shadow-chunky-lg scale-[1.03] animate-pulse'
                : 'bg-p2 text-white shadow-chunky-lg scale-[1.03]'
              : 'bg-cream/90 text-ink opacity-60 shadow-chunky-sm'
          }`}
        >
          <span className="text-4xl">{p2.avatar}</span>
          <h2 className="font-display font-bold text-xl truncate max-w-full">
            {p2.name}
          </h2>
          {activePlayer === 'p2' && (
            <span className="px-3 py-0.5 rounded-full bg-gold text-ink border-2 border-ink font-display font-bold text-xs">
              Tocca a te!
            </span>
          )}

          <div className="font-mono font-extrabold text-5xl sm:text-6xl tracking-tight my-1">
            {timeP2.toFixed(1)}
          </div>

          <div className="w-full h-3 bg-black/25 rounded-full overflow-hidden border border-black/20">
            <div
              className="h-full bg-gold transition-all duration-100"
              style={{
                width: `${(timeP2 / settings.duelDurationSeconds) * 100}%`,
              }}
            />
          </div>

          <div className="text-xs font-bold opacity-85">
            Indovinate: {p2Correct}
          </div>
        </div>
      </main>

      {/* Barra Voce & Pulsanti Rapidi Touch per Mobile (Sotto al centro, sempre a portata di pollice!) */}
      <div className="w-full max-w-6xl mx-auto shrink-0 card-cream rounded-2xl p-2 sm:p-3 flex items-center justify-between gap-2 shadow-chunky-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Bottone Microfono Interattivo: tocca per attivare o riavviare */}
          <button
            type="button"
            onClick={startMicSession}
            title={
              micListening
                ? 'Microfono attivo (tocca per riavviare)'
                : 'Tocca per attivare il microfono'
            }
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-ink flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
              micListening
                ? 'bg-mint text-ink shadow-sm'
                : 'bg-p2 text-white animate-pulse'
            }`}
          >
            {settings.micMode === 'discord-p2p' &&
            activePlayer === 'p2' &&
            p2RemoteConnected ? (
              <Radio className="w-5 h-5 text-ink animate-pulse" />
            ) : (
              <Mic
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  micListening ? 'text-ink' : 'text-white'
                }`}
              />
            )}
            {micListening && micVolume > 0.05 && (
              <span className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-mint pointer-events-none animate-ping opacity-60" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-[11px] font-bold text-ink/60 truncate flex items-center gap-1.5">
              <span>{activePlayer === 'p1' ? p1.name : p2.name} al mic</span>
              {!micListening && (
                <span className="text-p2 font-bold">(Tocca il mic)</span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-display font-bold text-ink truncate leading-tight">
              {liveTranscript ? (
                <span className="text-p1 font-extrabold">“{liveTranscript}”</span>
              ) : micListening ? (
                'Di’ cos’è o di’ “Passo”...'
              ) : micErrorMsg ? (
                <span className="text-p2">{micErrorMsg}</span>
              ) : (
                'Tocca l’icona mic per iniziare'
              )}
            </div>
          </div>
        </div>

        {/* Pulsanti Rapidi Touch per PASSO e BUONA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={triggerPass}
            disabled={passPenaltyLeft > 0 || correctFlash !== null}
            className="btn-push px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gold text-ink font-display font-black text-xs flex items-center gap-1 shadow-sm active:translate-y-1"
          >
            <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Passo (-3s)</span>
          </button>

          <button
            onClick={() => triggerCorrectGuess(currentItem.answer)}
            disabled={passPenaltyLeft > 0 || correctFlash !== null}
            title="Segna buona manualmente [Invio]"
            className="btn-push px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-mint text-ink font-display font-black text-xs flex items-center gap-1 shadow-sm active:translate-y-1"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Buona</span>
          </button>
        </div>
      </div>

      {/* Schermata di Celebrazione Vincitore del Duello */}
      {duelFinishPhase === 'winner' && duelFinishData && (
        <div className="fixed inset-0 z-50 bg-[#140e24]/92 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Raggi luminosi rotanti da game show */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <div className="w-[850px] h-[850px] rounded-full bg-[conic-gradient(from_0deg,#FFB800_0deg,transparent_60deg,#FF007A_120deg,transparent_180deg,#00F0FF_240deg,transparent_300deg,#FFB800_360deg)] animate-spin-slow" />
          </div>

          <div className="relative card-cream max-w-lg w-full rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-4 animate-reveal-pop border-[4px] border-ink shadow-card-hover z-10">
            {/* Avatar del vincitore con corona */}
            <div className="relative">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-[3.5px] border-ink shadow-chunky flex items-center justify-center text-6xl sm:text-7xl animate-bounce ${
                  duelFinishData.winner === 'p1'
                    ? 'bg-p1 text-white'
                    : 'bg-p2 text-white'
                }`}
              >
                {duelFinishData.winner === 'p1' ? p1.avatar : p2.avatar}
              </div>
              <div className="absolute -top-4 -right-3 text-4xl animate-pulse">
                👑
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold text-ink font-display font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-chunky-sm mb-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>Punto Conquistato!</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-5xl text-ink leading-tight">
                Ha vinto {duelFinishData.winner === 'p1' ? p1.name : p2.name}!
              </h2>
              <p className="text-sm font-semibold text-ink/70 mt-1">
                {duelFinishData.loser === 'p1' ? p1.name : p2.name} ha esaurito il
                tempo su &ldquo;{category.name}&rdquo;
              </p>
            </div>

            {/* Statistiche del Round */}
            <div className="w-full grid grid-cols-2 gap-3 bg-paper p-3.5 rounded-2xl border-2 border-ink">
              <div>
                <span className="text-[11px] font-bold text-ink/60 uppercase block">
                  Tempo Rimasto
                </span>
                <span className="font-mono font-extrabold text-2xl text-mint">
                  {duelFinishData.summary.winnerTimeLeft.toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-ink/60 uppercase block">
                  Foto Indovinate
                </span>
                <span className="font-display font-bold text-2xl text-ink">
                  {duelFinishData.winner === 'p1'
                    ? duelFinishData.summary.p1Correct
                    : duelFinishData.summary.p2Correct}{' '}
                  foto
                </span>
              </div>
            </div>

            {/* Pulsante Prossima Categoria */}
            <button
              onClick={handleProceedToDraft}
              className="btn-push w-full py-4 px-6 rounded-2xl bg-gold text-ink font-display font-bold text-lg flex items-center justify-center gap-2 mt-1 animate-bounce-soft"
            >
              <Sparkles className="w-5 h-5 text-ink" />
              <span>Scegli la Prossima Categoria</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modale Pausa */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="card-cream max-w-sm w-full rounded-3xl p-8 text-center flex flex-col items-center gap-4">
            <h2 className="font-display font-bold text-3xl text-ink">
              Gioco in pausa
            </h2>
            <p className="text-sm text-ink/70">
              Il tempo è fermo. Clicca qui sotto quando siete pronti a ripartire!
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="btn-push w-full py-3.5 rounded-2xl bg-gold text-ink font-display font-bold text-lg"
            >
              Riprendi
            </button>
          </div>
        </div>
      )}

      <footer className="max-w-6xl w-full mx-auto flex items-center justify-between text-xs text-cream/45 px-2">
        <span>Spazio = Passo • Invio = Buona • P = Pausa</span>
        <span className="font-mono text-[11px] text-cream/40">v{APP_VERSION}</span>
      </footer>
    </div>
  );
};
