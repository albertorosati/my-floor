import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  FastForward,
  Check,
  Pause,
  Play,
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
import { TheFloorBackground } from './TheFloorBackground';
import { ScorePips } from './ScorePips';

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

  // End of duel sequences:
  const [duelFinishPhase, setDuelFinishPhase] = useState<'reveal' | 'winner' | null>(null);
  const [duelFinishData, setDuelFinishData] = useState<{
    winner: PlayerId;
    loser: PlayerId;
    lastItem: DuelItem;
    summary: DuelSummary;
  } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [photoShake, setPhotoShake] = useState(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brokenIdsRef = useRef<Set<string>>(new Set());
  const resolvedUrlsRef = useRef<Map<string, string>>(new Map());

  const currentItem = deck[itemIndex % deck.length];
  const displaySrc = usingBackupUrl
    ? getBackupImageUrl(currentItem.imageUrl)
    : resolvedUrlsRef.current.get(currentItem.id) || currentItem.imageUrl;

  const [imageLoaded, setImageLoaded] = useState(() => isImageCached(displaySrc));

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

      setCorrectFlash({
        answer: st.currentItem.answer,
        byPlayer: st.activePlayer,
      });

      setTimeout(() => {
        if (stateRef.current.duelEnded) return;
        setCorrectFlash(null);
        setLiveTranscript('');
        setActivePlayer((prev) => (prev === 'p1' ? 'p2' : 'p1'));
        advanceToNextImage();
      }, 500);
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
    setPhotoShake(true);
    setTimeout(() => setPhotoShake(false), 300);

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
      setDuelFinishPhase('reveal');

      setTimeout(() => {
        setScreenShake(false);
      }, 450);

      setTimeout(() => {
        setDuelFinishPhase('winner');
        soundEngine.playGrandFanfare();
        soundEngine.playDuelVictory();
        hapticsService.vibrateVictory();

        finishTimerRef.current = setTimeout(() => {
          onDuelFinished(summary);
        }, 3400);
      }, 2200);
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
  }, [advanceToNextImage, handleTimeExpired]);

  const p1Active = activePlayer === 'p1';
  const p2Active = activePlayer === 'p2';
  const stageColor = p1Active ? 'p1' : 'p2';
  const p1Urgent = p1Active && timeP1 <= 10;
  const p2Urgent = p2Active && timeP2 <= 10;

  return (
    <div
      className={`relative h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden touch-none ${
        screenShake ? 'animate-screen-shake-6px' : ''
      }`}
    >
      {/* 1. Dynamic Floor Background Following Active Player */}
      <TheFloorBackground stage={stageColor} />

      {/* Main Single Width Container: Max 1100px Centered */}
      <div className="w-full max-w-[1100px] mx-auto flex-1 flex flex-col justify-between py-1 min-h-0">
        {/* ============================================================== */}
        {/* TOP BAR: Category (emoji + name) left, Pause right             */}
        {/* ============================================================== */}
        <header className="w-full flex items-center justify-between gap-3 shrink-0 py-1">
          <div className="flex items-center gap-2.5 text-paper min-w-0">
            <span className="text-3xl sm:text-4xl shrink-0">{category.icon}</span>
            <h1 className="font-display font-black text-xl sm:text-2xl truncate tracking-wide">
              {category.name}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="btn-push px-4 py-1.5 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center gap-1.5 shrink-0"
            aria-label={isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}
          >
            {isPaused ? <Play className="w-4 h-4 text-green" /> : <Pause className="w-4 h-4 stroke-[2.5]" />}
            <span>{isPaused ? t('arena.resume', settings.language) : t('arena.pause', settings.language)}</span>
          </button>
        </header>

        {/* ============================================================== */}
        {/* CENTER: [Player 1] [Photo] [Player 2] in one row, gap 24       */}
        {/* ============================================================== */}
        <main className="w-full my-auto flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 min-h-0 py-2">
          {/* Player 1 Card (Desktop: Left) */}
          <div
            className={`hidden lg:flex w-56 min-h-[220px] rounded-card border-[3px] border-ink p-5 flex-col items-center justify-center gap-2 text-center transition-all ${
              p1Active
                ? 'bg-blue text-white tactile-lifted'
                : 'bg-paper text-ink tactile-pressed'
            }`}
          >
            <span className="text-4xl">{p1.avatar}</span>
            <span className="font-display font-black text-lg truncate max-w-full">
              {p1.name}
            </span>
            <span
              className={`tabular-nums font-display font-black text-5xl tracking-tight my-0.5 ${
                p1Urgent ? 'text-yellow animate-urgent-pulse-hard' : ''
              }`}
            >
              {p1Active ? timeP1.toFixed(1) : Math.ceil(timeP1)}
            </span>
            <ScorePips
              score={p1Correct}
              targetWins={settings.targetWins}
              playerColor="blue"
              size="md"
            />
          </div>

          {/* Photo Hero: Real aspect ratio (max 58vh), 12px mat, 3px outline, hard shadow */}
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center relative">
            <div
              key={`${currentItem.id}-${itemIndex}`}
              className={`relative bg-paper p-3 rounded-card border-[3px] border-ink shadow-hard max-h-[58vh] max-w-full flex items-center justify-center animate-photo-slap ${
                photoShake ? 'animate-screen-shake-6px' : ''
              }`}
            >
              {/* Timeout Reveal */}
              {duelFinishPhase === 'reveal' && duelFinishData && (
                <div className="absolute inset-0 bg-paper rounded-xl z-30 flex flex-col items-center justify-center p-6 text-center text-ink animate-pop-in">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-ink/70 mb-1">
                    {settings.language === 'en' ? 'Time ran out! Answer was:' : 'Tempo scaduto! Era:'}
                  </span>
                  <h3 className="font-display font-black text-3xl sm:text-5xl text-ink">
                    {duelFinishData.lastItem.answer}
                  </h3>
                </div>
              )}

              {/* Feedback: Green Starburst "YES!" Over Photo */}
              {correctFlash && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none animate-starburst-pop">
                  <div className="relative flex items-center justify-center">
                    <svg viewBox="0 0 160 160" className="w-40 h-40 sm:w-56 sm:h-56 drop-shadow-[6px_6px_0_#14121F]">
                      <polygon
                        points="80,0 100,35 140,20 128,60 160,80 128,100 140,140 100,125 80,160 60,125 20,140 32,100 0,80 32,60 20,20 60,35"
                        fill="#19C37D"
                        stroke="#14121F"
                        strokeWidth="5"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center -rotate-3 text-ink">
                      <span className="font-display font-black text-3xl sm:text-5xl leading-none">
                        YES!
                      </span>
                      <span className="font-display font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px] mt-1">
                        {correctFlash.answer}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback: Red "PASS -3s" Burst Over Photo */}
              {!correctFlash && passPenaltyLeft > 0 && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none animate-pass-burst">
                  <div className="px-5 py-3 rounded-2xl bg-red text-white border-[3px] border-ink shadow-hard font-display font-black text-2xl sm:text-4xl uppercase -rotate-3">
                    PASS -3s
                  </div>
                </div>
              )}

              {/* The Photo Itself: Fits Real Aspect Ratio */}
              <img
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
                className={`max-h-[50vh] sm:max-h-[54vh] w-auto max-w-full object-contain rounded-lg transition-opacity duration-150 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>

            {/* Comic Speech Bubble Anchored to Active Card */}
            <div
              className={`mt-3 w-full max-w-md mx-auto speech-bubble speech-bubble-tail-bottom px-4 py-2 text-center transition-all`}
            >
              <span className="font-display font-black text-lg sm:text-xl text-ink leading-tight line-clamp-2">
                {liveTranscript ? (
                  <span className={p1Active ? 'text-blue' : 'text-red'}>
                    “{liveTranscript}”
                  </span>
                ) : micListening ? (
                  settings.language === 'en' ? 'Say what you see or "Pass"...' : 'Di’ cosa vedi o "Passo"...'
                ) : micErrorMsg ? (
                  <span className="text-red">{micErrorMsg}</span>
                ) : (
                  settings.language === 'en' ? 'Microphone listening...' : 'Microfono in ascolto...'
                )}
              </span>
            </div>
          </div>

          {/* Player 2 Card (Desktop: Right) */}
          <div
            className={`hidden lg:flex w-56 min-h-[220px] rounded-card border-[3px] border-ink p-5 flex-col items-center justify-center gap-2 text-center transition-all ${
              p2Active
                ? 'bg-red text-white tactile-lifted'
                : 'bg-paper text-ink tactile-pressed'
            }`}
          >
            <span className="text-4xl">{p2.avatar}</span>
            <span className="font-display font-black text-lg truncate max-w-full">
              {p2.name}
            </span>
            <span
              className={`tabular-nums font-display font-black text-5xl tracking-tight my-0.5 ${
                p2Urgent ? 'text-yellow animate-urgent-pulse-hard' : ''
              }`}
            >
              {p2Active ? timeP2.toFixed(1) : Math.ceil(timeP2)}
            </span>
            <ScorePips
              score={p2Correct}
              targetWins={settings.targetWins}
              playerColor="red"
              size="md"
            />
          </div>
        </main>

        {/* Mobile Player Cards (Row Stacked under Photo) */}
        <div className="grid grid-cols-2 gap-3 w-full my-2 lg:hidden shrink-0">
          {/* P1 Card Mobile */}
          <div
            className={`p-3 rounded-card border-[3px] border-ink flex items-center justify-between gap-2 transition-all ${
              p1Active
                ? 'bg-blue text-white tactile-lifted'
                : 'bg-paper text-ink tactile-pressed'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">{p1.avatar}</span>
              <div className="min-w-0">
                <span className="font-display font-black text-xs truncate block leading-tight">
                  {p1.name}
                </span>
                <ScorePips
                  score={p1Correct}
                  targetWins={settings.targetWins}
                  playerColor="blue"
                  size="sm"
                />
              </div>
            </div>
            <span
              className={`tabular-nums font-display font-black text-2xl shrink-0 ${
                p1Urgent ? 'text-yellow animate-urgent-pulse-hard' : ''
              }`}
            >
              {p1Active ? timeP1.toFixed(1) : Math.ceil(timeP1)}
            </span>
          </div>

          {/* P2 Card Mobile */}
          <div
            className={`p-3 rounded-card border-[3px] border-ink flex items-center justify-between gap-2 transition-all ${
              p2Active
                ? 'bg-red text-white tactile-lifted'
                : 'bg-paper text-ink tactile-pressed'
            }`}
          >
            <span
              className={`tabular-nums font-display font-black text-2xl shrink-0 ${
                p2Urgent ? 'text-yellow animate-urgent-pulse-hard' : ''
              }`}
            >
              {p2Active ? timeP2.toFixed(1) : Math.ceil(timeP2)}
            </span>
            <div className="flex items-center gap-2 min-w-0 text-right justify-end">
              <div className="min-w-0">
                <span className="font-display font-black text-xs truncate block leading-tight">
                  {p2.name}
                </span>
                <ScorePips
                  score={p2Correct}
                  targetWins={settings.targetWins}
                  playerColor="red"
                  size="sm"
                />
              </div>
              <span className="text-2xl shrink-0">{p2.avatar}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM ACTION BAR: 3-Bar Mic Meter | Pass (paper) | Correct (green) */}
        {/* ============================================================== */}
        <div className="w-full shrink-0 flex flex-col items-center gap-2 py-1">
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Real Mic Level Meter (3 Bars driven by live mic volume) */}
            <div
              className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-paper border-[3px] border-ink shadow-hard shrink-0 h-16"
              title="Mic level"
            >
              <Mic className={`w-5 h-5 ${micListening ? 'text-green' : 'text-ink/40'}`} />
              <div className="flex items-end gap-1 h-8">
                <span
                  className={`w-2 rounded-sm border border-ink transition-all ${
                    micListening && micVolume > 0.05 ? 'bg-green h-4' : 'bg-ink/15 h-3'
                  }`}
                />
                <span
                  className={`w-2 rounded-sm border border-ink transition-all ${
                    micListening && micVolume > 0.25 ? 'bg-green h-6' : 'bg-ink/15 h-3'
                  }`}
                />
                <span
                  className={`w-2 rounded-sm border border-ink transition-all ${
                    micListening && micVolume > 0.55 ? 'bg-green h-8' : 'bg-ink/15 h-3'
                  }`}
                />
              </div>
            </div>

            {/* Pass Button (Paper, min 64px tall, min 160px wide) */}
            <button
              type="button"
              onClick={triggerPass}
              disabled={passPenaltyLeft > 0 || correctFlash !== null}
              className="btn-push flex-1 sm:flex-initial min-h-[64px] min-w-[140px] sm:min-w-[160px] px-6 py-3 rounded-2xl bg-paper text-ink font-display font-black text-xl flex items-center justify-center gap-2"
            >
              <FastForward className="w-5 h-5" />
              <span>{t('arena.pass', settings.language)}</span>
            </button>

            {/* Correct Button (Green, min 64px tall, min 160px wide) */}
            <button
              type="button"
              onClick={() => triggerCorrectGuess(currentItem.answer)}
              disabled={passPenaltyLeft > 0 || correctFlash !== null}
              className="btn-push flex-1 sm:flex-initial min-h-[64px] min-w-[140px] sm:min-w-[160px] px-6 py-3 rounded-2xl bg-green text-ink font-display font-black text-xl flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>{t('arena.correct', settings.language)}</span>
            </button>
          </div>

          {/* Desktop keyboard hint: one faint line */}
          <span className="hidden lg:block text-xs font-medium text-paper/60 tracking-wider">
            {t('arena.keyboardHelp', settings.language)}
          </span>
        </div>
      </div>

      {/* Round Winner Celebration Modal */}
      {duelFinishPhase === 'winner' && duelFinishData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 animate-pop-in">
            <div
              className={`w-20 h-20 rounded-2xl border-[3px] border-ink shadow-hard flex items-center justify-center text-5xl animate-bounce ${
                duelFinishData.winner === 'p1' ? 'bg-blue text-white' : 'bg-red text-white'
              }`}
            >
              {duelFinishData.winner === 'p1' ? p1.avatar : p2.avatar}
            </div>

            <div>
              <span className="text-xs font-bold text-ink/70 uppercase tracking-wider block mb-1">
                {t('arena.pointScoredTitle', settings.language)}
              </span>
              <h2 className="font-display font-black text-3xl text-ink">
                {t('arena.hasWon', settings.language, {
                  name: localizePlayerName(
                    duelFinishData.winner === 'p1' ? p1.name : p2.name,
                    settings.language
                  ),
                })}
              </h2>
            </div>

            <div className="w-full flex items-center justify-around py-3 border-y-[3px] border-ink/20">
              <div>
                <span className="text-xs text-ink/70 block">{t('arena.timeLeft', settings.language)}</span>
                <span className="font-display font-black text-2xl text-green">
                  {duelFinishData.summary.winnerTimeLeft.toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-xs text-ink/70 block">{t('arena.correctPhotos', settings.language)}</span>
                <span className="font-display font-black text-2xl text-ink">
                  {duelFinishData.winner === 'p1'
                    ? duelFinishData.summary.p1Correct
                    : duelFinishData.summary.p2Correct}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToDraft}
              className="btn-push w-full py-3.5 px-6 rounded-xl bg-yellow text-ink font-display font-black text-lg flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <span>{t('arena.chooseNextCategory', settings.language)}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Game Paused Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 animate-pop-in">
            <h2 className="font-display font-black text-3xl text-ink">
              {t('arena.pausedTitle', settings.language)}
            </h2>
            <p className="text-sm font-sans text-ink/80">
              {t('arena.pausedDesc', settings.language)}
            </p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="btn-push w-full py-3.5 rounded-xl bg-yellow text-ink font-display font-black text-lg uppercase tracking-wide"
            >
              {t('arena.resume', settings.language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
