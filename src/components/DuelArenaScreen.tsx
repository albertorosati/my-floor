import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  FastForward,
  CheckCircle2,
  Pause,
  Play,
  Volume2,
  Flame,
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

interface DuelArenaScreenProps {
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

  // Stato penalità PASSO (3.0s durante i quali il tempo del giocatore continua a scorrere)
  const [passPenaltyLeft, setPassPenaltyLeft] = useState<number>(0);

  // Breve flash celebrativo (500ms) quando si indovina, prima di passare il turno
  const [correctFlash, setCorrectFlash] = useState<{
    answer: string;
    byPlayer: PlayerId;
  } | null>(null);

  // Statistiche duello
  const [p1Correct, setP1Correct] = useState(0);
  const [p2Correct, setP2Correct] = useState(0);
  const [p1Passes, setP1Passes] = useState(0);
  const [p2Passes, setP2Passes] = useState(0);
  const [streak, setStreak] = useState(0);

  // Feedback microfono in tempo reale
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  const [micListening, setMicListening] = useState(false);
  const [imgError, setImgError] = useState(false);

  const currentItem = deck[itemIndex % deck.length];

  // Refs per accesso sincrono dentro i callback vocali e timer
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
    setImgError(false);
    setItemIndex((prev) => {
      const next = prev + 1;
      if (next >= deck.length) {
        setDeck(shuffleItems(category.items));
        return 0;
      }
      return next;
    });
  }, [deck.length, category.items]);

  // Azione: RISPOSTA ESATTA!
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

      // Cooldown anti-eco per non far scattare l'immagine successiva con la coda vocale
      ignoreVoiceUntilRef.current = performance.now() + 650;
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
      }, 520);
    },
    [advanceToNextImage]
  );

  // Azione: PASSO! (3 secondi di penalità, il turno resta allo stesso giocatore!)
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

    ignoreVoiceUntilRef.current = performance.now() + 650;
    recognizerRef.current?.consumeCurrentBuffer();

    soundEngine.playPassPenalty();
    setStreak(0);
    setLiveTranscript('⏭️ PASSO!');

    if (st.activePlayer === 'p1') {
      setP1Passes((p) => p + 1);
    } else {
      setP2Passes((p) => p + 1);
    }

    setPassPenaltyLeft(settings.passPenaltySeconds);
  }, [settings.passPenaltySeconds]);

  // Valutazione centralizzata dell'input vocale (sia locale che remoto P2P)
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

      // Se siamo in modalità Discord P2P con Giocatore 2 connesso,
      // il mic di P1 risponde nel turno di P1 e il mic remoto di P2 risponde nel turno di P2
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
    [
      settings.micMode,
      p2RemoteConnected,
      triggerPass,
      triggerCorrectGuess,
    ]
  );

  // Avvio del riconoscimento vocale locale
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

  // Ricezione pacchetti dal microfono remoto P2P (Modalità Discord per Giocatore 2)
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

  // Invia aggiornamenti di stato al microfono remoto di Giocatore 2
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

  // Scorciatoie tastiera di emergenza (Spazio = Passo, Invio = Buona, P = Pausa)
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

  // Loop ad alta precisione (50ms) per i due cronometri e per la penalità PASSO
  useEffect(() => {
    let lastTick = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      const st = stateRef.current;
      if (st.duelEnded || st.isPaused) return;

      // Se siamo nel flash verde di cambio turno, i cronometri sono congelati
      if (st.correctFlash !== null) return;

      // Gestione countdown penalità PASSO (3.0s)
      if (st.passPenaltyLeft > 0) {
        const nextPenalty = Math.max(0, st.passPenaltyLeft - dt);
        setPassPenaltyLeft(nextPenalty);
        if (nextPenalty === 0) {
          setLiveTranscript('');
          advanceToNextImage();
        }
      }

      // Decrementa il cronometro del giocatore di turno
      if (st.activePlayer === 'p1') {
        const nextP1 = Math.max(0, st.timeP1 - dt);
        setTimeP1(nextP1);

        const wholeSec = Math.ceil(nextP1);
        if (wholeSec !== lastSecondBeepRef.current && nextP1 > 0) {
          lastSecondBeepRef.current = wholeSec;
          soundEngine.playClockTick(nextP1 <= 10);
        }

        if (nextP1 <= 0) {
          stateRef.current.duelEnded = true;
          soundEngine.playDuelVictory();
          onDuelFinished({
            winner: 'p2',
            loser: 'p1',
            categoryName: category.name,
            categoryIcon: category.icon,
            winnerTimeLeft: st.timeP2,
            p1Correct: st.p1Correct,
            p2Correct: st.p2Correct,
            p1Passes: st.p1Passes,
            p2Passes: st.p2Passes,
            conqueredTilesCount: 1,
          });
        }
      } else {
        const nextP2 = Math.max(0, st.timeP2 - dt);
        setTimeP2(nextP2);

        const wholeSec = Math.ceil(nextP2);
        if (wholeSec !== lastSecondBeepRef.current && nextP2 > 0) {
          lastSecondBeepRef.current = wholeSec;
          soundEngine.playClockTick(nextP2 <= 10);
        }

        if (nextP2 <= 0) {
          stateRef.current.duelEnded = true;
          soundEngine.playDuelVictory();
          onDuelFinished({
            winner: 'p1',
            loser: 'p2',
            categoryName: category.name,
            categoryIcon: category.icon,
            winnerTimeLeft: st.timeP1,
            p1Correct: st.p1Correct,
            p2Correct: st.p2Correct,
            p1Passes: st.p1Passes,
            p2Passes: st.p2Passes,
            conqueredTilesCount: 1,
          });
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [
    advanceToNextImage,
    category.icon,
    category.name,
    onDuelFinished,
  ]);

  const p1Urgent = activePlayer === 'p1' && timeP1 <= 10;
  const p2Urgent = activePlayer === 'p2' && timeP2 <= 10;

  return (
    <div className="min-h-screen studio-bg studio-grid-overlay flex flex-col justify-between p-4 md:p-6 select-none relative overflow-hidden">
      {/* Header Categoria & Controllo Pausa */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 block">
              CATEGORIA IN DUELLO
            </span>
            <h1 className="font-display font-black text-xl md:text-3xl uppercase tracking-wider text-white">
              {category.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5 animate-bounce">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>RITMO DI FUOCO: {streak} DI FILA!</span>
            </div>
          )}

          <button
            onClick={() => setIsPaused((p) => !p)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-mono uppercase flex items-center gap-1.5 transition-all"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Riprendi</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-amber-300" />
                <span>Pausa [P]</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Arena Centrale: Cronometro P1 | Immagine | Cronometro P2 */}
      <main className="max-w-6xl w-full mx-auto my-3 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center z-10">
        {/* Colonna Giocatore 1 */}
        <div
          className={`lg:col-span-3 rounded-3xl p-5 border-2 transition-all duration-300 flex flex-col items-center justify-between gap-4 ${
            activePlayer === 'p1'
              ? p1Urgent
                ? 'bg-rose-950/80 border-rose-400 shadow-2xl shadow-rose-500/40 scale-[1.03] animate-pulse-fast'
                : 'bg-[#081b33]/95 border-cyan-400 neon-cyan-box scale-[1.03]'
              : 'bg-[#070b16]/60 border-white/10 opacity-55'
          }`}
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-4xl">{p1.avatar}</span>
            <h2 className="font-display font-black text-xl md:text-2xl uppercase tracking-wider text-cyan-300">
              {p1.name}
            </h2>
            {activePlayer === 'p1' && (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-black font-mono font-extrabold text-[10px] uppercase tracking-widest">
                PARLA ORA!
              </span>
            )}
          </div>

          <div
            className={`font-mono font-extrabold text-5xl md:text-7xl tracking-tight ${
              p1Urgent
                ? 'text-rose-400 text-glow-pink'
                : 'text-white text-glow-cyan'
            }`}
          >
            {timeP1.toFixed(1)}
          </div>

          {/* Barra progresso tempo P1 */}
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                p1Urgent ? 'bg-rose-500' : 'bg-cyan-400'
              }`}
              style={{
                width: `${(timeP1 / settings.duelDurationSeconds) * 100}%`,
              }}
            />
          </div>

          <div className="w-full flex justify-between text-xs font-mono text-slate-400 pt-1 border-t border-white/10">
            <span>Indovinate: {p1Correct}</span>
            <span>Passi: {p1Passes}</span>
          </div>
        </div>

        {/* Colonna Centrale: Il Display Gigante dell'Immagine */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4">
          <div
            className={`relative w-full aspect-[4/3] max-h-[430px] rounded-3xl border-4 flex flex-col items-center justify-center p-6 overflow-hidden transition-all duration-200 ${
              correctFlash
                ? 'bg-emerald-950/90 border-emerald-400 shadow-2xl shadow-emerald-500/40 scale-[1.02]'
                : passPenaltyLeft > 0
                ? 'bg-amber-950/90 border-amber-400 shadow-2xl shadow-amber-500/40'
                : activePlayer === 'p1'
                ? 'bg-[#0b1329]/95 border-cyan-400/80 neon-cyan-box'
                : 'bg-[#210b1a]/95 border-rose-500/80 neon-pink-box'
            }`}
          >
            {/* Stato 1: Flash Verde Risposta Esatta */}
            {correctFlash && (
              <div className="flex flex-col items-center justify-center text-center gap-3 animate-bounce z-20">
                <CheckCircle2 className="w-20 h-20 text-emerald-400" />
                <span className="font-mono text-sm uppercase tracking-widest text-emerald-300 font-bold">
                  RISPOSTA ESATTA!
                </span>
                <h3 className="font-display font-black text-4xl md:text-5xl text-white uppercase">
                  {correctFlash.answer}
                </h3>
              </div>
            )}

            {/* Stato 2: Penalità 3 Secondi dopo aver detto PASSO */}
            {!correctFlash && passPenaltyLeft > 0 && (
              <div className="flex flex-col items-center justify-center text-center gap-3 z-20">
                <FastForward className="w-16 h-16 text-amber-400 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest text-amber-300">
                  PENALITÀ PASSO — ERA:
                </span>
                <h3 className="font-display font-black text-3xl md:text-4xl text-white uppercase">
                  {currentItem.answer}
                </h3>
                <div className="mt-2 font-mono font-black text-5xl text-amber-400">
                  {passPenaltyLeft.toFixed(1)}s
                </div>
                <p className="text-xs text-amber-200/80">
                  Nuova immagine in arrivo per{' '}
                  {activePlayer === 'p1' ? p1.name : p2.name}...
                </p>
              </div>
            )}

            {/* Stato 3: Immagine da Indovinare */}
            {!correctFlash && passPenaltyLeft === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                {currentItem.imageUrl && !imgError ? (
                  <img
                    key={currentItem.id}
                    src={currentItem.imageUrl}
                    alt="Indovina l'immagine"
                    onError={() => setImgError(true)}
                    className="max-h-[270px] md:max-h-[310px] w-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)] transition-transform duration-200 scale-100 hover:scale-105"
                  />
                ) : (
                  <div className="text-[130px] md:text-[160px] leading-none select-none drop-shadow-2xl">
                    {currentItem.fallbackEmoji || '❓'}
                  </div>
                )}

                {currentItem.subLabel && (
                  <span className="mt-4 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-slate-300">
                    Indizio: {currentItem.subLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Barra Live Sottotitoli Microfono + Pulsanti Rapidi */}
          <div className="w-full rounded-2xl bg-[#070b17]/95 border border-white/15 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
                {settings.micMode === 'discord-p2p' &&
                activePlayer === 'p2' &&
                p2RemoteConnected ? (
                  <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : (
                  <Mic
                    className={`w-5 h-5 ${
                      micListening
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  />
                )}
                {/* Anello reattivo al volume della voce */}
                <span
                  className="absolute inset-0 rounded-xl border-2 border-emerald-400/60 pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + micVolume * 0.35})`,
                    opacity: micVolume > 0.05 ? 0.9 : 0,
                  }}
                />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {settings.micMode === 'discord-p2p' &&
                  activePlayer === 'p2' &&
                  p2RemoteConnected
                    ? `MIC REMOTO DISCORD (${p2.name})`
                    : `ASCOLTO VOCALE ATTIVO (${
                        activePlayer === 'p1' ? p1.name : p2.name
                      })`}
                </span>
                <p className="text-sm font-mono font-bold text-cyan-200 truncate">
                  {liveTranscript
                    ? `“${liveTranscript}”`
                    : 'Parla per indovinare o di’ “PASSO”...'}
                </p>
              </div>
            </div>

            {/* Controlli fisici/paracadute a schermo */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={triggerPass}
                disabled={passPenaltyLeft > 0 || correctFlash !== null}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <FastForward className="w-4 h-4" />
                <span>PASSO (-3s)</span>
              </button>

              <button
                onClick={() => triggerCorrectGuess(currentItem.answer)}
                disabled={passPenaltyLeft > 0 || correctFlash !== null}
                title="Convalida manualmente [Invio]"
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Buona</span>
              </button>
            </div>
          </div>
        </div>

        {/* Colonna Giocatore 2 */}
        <div
          className={`lg:col-span-3 rounded-3xl p-5 border-2 transition-all duration-300 flex flex-col items-center justify-between gap-4 ${
            activePlayer === 'p2'
              ? p2Urgent
                ? 'bg-rose-950/90 border-yellow-400 shadow-2xl shadow-rose-500/50 scale-[1.03] animate-pulse-fast'
                : 'bg-[#2a0818]/95 border-rose-500 neon-pink-box scale-[1.03]'
              : 'bg-[#070b16]/60 border-white/10 opacity-55'
          }`}
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-4xl">{p2.avatar}</span>
            <h2 className="font-display font-black text-xl md:text-2xl uppercase tracking-wider text-rose-300">
              {p2.name}
            </h2>
            {activePlayer === 'p2' && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-extrabold text-[10px] uppercase tracking-widest">
                PARLA ORA!
              </span>
            )}
          </div>

          <div
            className={`font-mono font-extrabold text-5xl md:text-7xl tracking-tight ${
              p2Urgent
                ? 'text-yellow-300 text-glow-gold'
                : 'text-white text-glow-pink'
            }`}
          >
            {timeP2.toFixed(1)}
          </div>

          {/* Barra progresso tempo P2 */}
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                p2Urgent ? 'bg-yellow-400' : 'bg-rose-500'
              }`}
              style={{
                width: `${(timeP2 / settings.duelDurationSeconds) * 100}%`,
              }}
            />
          </div>

          <div className="w-full flex justify-between text-xs font-mono text-slate-400 pt-1 border-t border-white/10">
            <span>Indovinate: {p2Correct}</span>
            <span>Passi: {p2Passes}</span>
          </div>
        </div>
      </main>

      {/* Overlay Pausa */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl bg-[#0b1124] border border-white/20 p-8 text-center flex flex-col items-center gap-4">
            <Volume2 className="w-12 h-12 text-cyan-400" />
            <h2 className="font-display font-black text-3xl uppercase">
              DUELLO IN PAUSA
            </h2>
            <p className="text-sm text-slate-400">
              I cronometri sono fermi. L&apos;immagine è nascosta finché non riprendi.
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 font-display font-bold text-lg uppercase"
            >
              RIPRENDI DUELLO
            </button>
          </div>
        </div>
      )}

      {/* Footer Info Tasti */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs font-mono text-slate-500 z-10">
        [Spazio] Passo (-3s) • [Invio] Convalida Manuale • [P] Pausa
      </footer>
    </div>
  );
};
