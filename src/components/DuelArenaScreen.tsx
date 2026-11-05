import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  FastForward,
  Check,
  Pause,
  Play,
  Radio,
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
import { getBackupImageUrl } from '../data/categories';
import { gameConfig } from '../services/configService';

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

function shuffleItems(items: DuelItem[]): DuelItem[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
    shuffleItems(category.items)
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
  const [usingBackupUrl, setUsingBackupUrl] = useState(false);

  const brokenIdsRef = useRef<Set<string>>(new Set());
  const resolvedUrlsRef = useRef<Map<string, string>>(new Map());

  const currentItem = deck[itemIndex % deck.length];
  const displaySrc = usingBackupUrl
    ? getBackupImageUrl(currentItem.imageUrl)
    : resolvedUrlsRef.current.get(currentItem.id) || currentItem.imageUrl;

  // Preloader rolling: mantiene sempre pre-caricate in RAM le prossime fotografie configurate
  useEffect(() => {
    const preloadCount = gameConfig.options.preloaderWindowSize;
    for (let offset = 1; offset <= preloadCount; offset++) {
      const candidate = deck[(itemIndex + offset) % deck.length];
      if (
        !candidate ||
        brokenIdsRef.current.has(candidate.id) ||
        resolvedUrlsRef.current.has(candidate.id)
      ) {
        continue;
      }

      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        resolvedUrlsRef.current.set(candidate.id, candidate.imageUrl);
      };
      img.onerror = () => {
        // Prova subito il proxy WebP di emergenza
        const backup = getBackupImageUrl(candidate.imageUrl);
        const img2 = new Image();
        img2.onload = () => {
          resolvedUrlsRef.current.set(candidate.id, backup);
        };
        img2.onerror = () => {
          brokenIdsRef.current.add(candidate.id);
        };
        img2.src = backup;
      };
      img.src = candidate.imageUrl;
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
        setDeck(shuffleItems(category.items));
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

  useEffect(() => {
    const rec = new SmartSpeechRecognizer(
      (alternatives) => {
        processSpokenAlternatives(alternatives, 'p1');
      },
      (listening) => {
        setMicListening(listening);
      },
      (vol) => {
        setMicVolume(vol);
      }
    );
    recognizerRef.current = rec;
    rec.start();

    return () => {
      rec.stop();
    };
  }, [processSpokenAlternatives]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [triggerPass, triggerCorrectGuess]);

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
          soundEngine.playClockTick(
            nextP1 <= gameConfig.options.urgentThresholdSeconds
          );
        }

        if (nextP1 <= 0) {
          stateRef.current.duelEnded = true;
          soundEngine.playDuelVictory();
          onDuelFinished({
            roundNumber,
            winner: 'p2',
            loser: 'p1',
            categoryId: category.id,
            categoryName: category.name,
            categoryIcon: category.icon,
            winnerTimeLeft: st.timeP2,
            p1Correct: st.p1Correct,
            p2Correct: st.p2Correct,
            p1Passes: st.p1Passes,
            p2Passes: st.p2Passes,
          });
        }
      } else {
        const nextP2 = Math.max(0, st.timeP2 - dt);
        setTimeP2(nextP2);

        const wholeSec = Math.ceil(nextP2);
        if (wholeSec !== lastSecondBeepRef.current && nextP2 > 0) {
          lastSecondBeepRef.current = wholeSec;
          soundEngine.playClockTick(
            nextP2 <= gameConfig.options.urgentThresholdSeconds
          );
        }

        if (nextP2 <= 0) {
          stateRef.current.duelEnded = true;
          soundEngine.playDuelVictory();
          onDuelFinished({
            roundNumber,
            winner: 'p1',
            loser: 'p2',
            categoryId: category.id,
            categoryName: category.name,
            categoryIcon: category.icon,
            winnerTimeLeft: st.timeP1,
            p1Correct: st.p1Correct,
            p2Correct: st.p2Correct,
            p1Passes: st.p1Passes,
            p2Passes: st.p2Passes,
          });
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

  return (
    <div className="min-h-screen party-stage-bg flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Barra Superiore: Categoria & Pausa */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gold border-[2.5px] border-ink shadow-chunky-sm flex items-center justify-center text-2xl">
            {category.icon}
          </div>
          <div>
            <span className="text-xs font-bold text-cream/60 block">
              Round {roundNumber}
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-cream leading-tight">
              {category.name}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsPaused((p) => !p)}
          className="btn-push px-4 py-2 rounded-xl bg-cream text-ink font-display font-bold text-xs flex items-center gap-1.5"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 text-mint" />
              <span>Riprendi</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4 text-ink" />
              <span>Pausa</span>
            </>
          )}
        </button>
      </header>

      {/* Palco Centrale: Timer P1 | Grande Cornice Fotografica | Timer P2 */}
      <main className="max-w-6xl w-full mx-auto my-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Blocco Cronometro Giocatore 1 */}
        <div
          className={`lg:col-span-3 rounded-3xl border-[3px] border-ink p-5 flex flex-col items-center gap-3 transition-all duration-200 ${
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

        {/* Cornice Centrale della Fotografia Vera (Sfondo Studio Chiaro ad alto contrasto anche per PNG trasparenti!) */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          <div
            className={`relative w-full h-[350px] sm:h-[440px] rounded-3xl border-[4px] border-ink shadow-chunky-lg overflow-hidden flex items-center justify-center transition-colors duration-150 ${
              correctFlash
                ? 'bg-mint'
                : passPenaltyLeft > 0
                ? 'bg-gold'
                : 'bg-[radial-gradient(circle,#ffffff_0%,#f7f2e7_68%,#e6decb_100%)]'
            }`}
          >
            {/* Flash Risposta Indovinata */}
            {correctFlash && (
              <div className="p-6 text-center text-ink flex flex-col items-center gap-3 animate-pop-in z-20">
                <div className="w-16 h-16 rounded-full bg-cream border-[3px] border-ink flex items-center justify-center shadow-chunky-sm">
                  <Check className="w-9 h-9 text-mint stroke-[3]" />
                </div>
                <span className="font-display font-bold text-sm uppercase tracking-wider">
                  Esatto!
                </span>
                <h3 className="font-display font-bold text-3xl sm:text-5xl">
                  {correctFlash.answer}
                </h3>
              </div>
            )}

            {/* Schermata 3 Secondi dopo aver detto PASSO */}
            {!correctFlash && passPenaltyLeft > 0 && (
              <div className="p-6 text-center text-ink flex flex-col items-center gap-2 z-20 animate-pop-in">
                <span className="font-display font-bold text-sm uppercase">
                  Passo! Era:
                </span>
                <h3 className="font-display font-bold text-3xl sm:text-4xl">
                  {currentItem.answer}
                </h3>
                <div className="mt-2 px-5 py-2 rounded-2xl bg-cream border-[3px] border-ink font-mono font-extrabold text-4xl shadow-chunky-sm">
                  {passPenaltyLeft.toFixed(1)}s
                </div>
              </div>
            )}

            {/* Fotografia Reale HD su passepartout chiaro (visibilità 100% sia per foto piene sia per PNG trasparenti/scontornati!) */}
            {!correctFlash && passPenaltyLeft === 0 && (
              <>
                <img
                  src={displaySrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-20 pointer-events-none"
                />
                <div className="relative z-10 w-full h-full p-3 sm:p-4 flex items-center justify-center">
                  <img
                    key={`${currentItem.id}-${usingBackupUrl ? 'b' : 'p'}`}
                    src={displaySrc}
                    alt="Cosa vedi nella foto?"
                    onError={() => {
                      if (!usingBackupUrl) {
                        setUsingBackupUrl(true);
                      } else {
                        brokenIdsRef.current.add(currentItem.id);
                        advanceToNextImage();
                      }
                    }}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl drop-shadow-[0_10px_22px_rgba(24,18,38,0.22)]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Barra Voce & Pulsanti Rapidi */}
          <div className="card-cream rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
              <div className="relative w-10 h-10 rounded-xl bg-paper border-2 border-ink flex items-center justify-center shrink-0">
                {settings.micMode === 'discord-p2p' &&
                activePlayer === 'p2' &&
                p2RemoteConnected ? (
                  <Radio className="w-5 h-5 text-p2 animate-pulse" />
                ) : (
                  <Mic
                    className={`w-5 h-5 ${
                      micListening ? 'text-mint' : 'text-p2'
                    }`}
                  />
                )}
                <span
                  className="absolute inset-0 rounded-xl border-2 border-mint pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + micVolume * 0.3})`,
                    opacity: micVolume > 0.06 ? 0.9 : 0,
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-ink/55">
                  {activePlayer === 'p1' ? p1.name : p2.name} al microfono
                </div>
                <div className="text-sm font-display font-bold text-ink truncate">
                  {liveTranscript
                    ? `“${liveTranscript}”`
                    : 'Di’ cos’è oppure di’ “Passo”...'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={triggerPass}
                disabled={passPenaltyLeft > 0 || correctFlash !== null}
                className="btn-push px-4 py-2 rounded-xl bg-gold text-ink font-display font-bold text-xs flex items-center gap-1.5"
              >
                <FastForward className="w-4 h-4" />
                <span>Passo (-3s)</span>
              </button>

              <button
                onClick={() => triggerCorrectGuess(currentItem.answer)}
                disabled={passPenaltyLeft > 0 || correctFlash !== null}
                title="Segna buona manualmente [Invio]"
                className="btn-push px-3.5 py-2 rounded-xl bg-mint text-ink font-display font-bold text-xs flex items-center gap-1"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Buona</span>
              </button>
            </div>
          </div>
        </div>

        {/* Blocco Cronometro Giocatore 2 */}
        <div
          className={`lg:col-span-3 rounded-3xl border-[3px] border-ink p-5 flex flex-col items-center gap-3 transition-all duration-200 ${
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

      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-cream/45">
        Spazio = Passo • Invio = Buona • P = Pausa
      </footer>
    </div>
  );
};
