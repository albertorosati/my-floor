import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Users,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Copy,
  Check,
  FolderPlus,
  ShieldAlert,
  Clock,
  Grid,
  Tv,
} from 'lucide-react';
import {
  Category,
  GameSettings,
  GridSizeOption,
  MicMode,
  PlayerConfig,
} from '../types/game';
import { SmartSpeechRecognizer } from '../engine/speechRecognition';

interface LobbyScreenProps {
  p1: PlayerConfig;
  p2: PlayerConfig;
  onUpdatePlayer: (id: 'p1' | 'p2', name: string, avatar: string) => void;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  categories: Category[];
  roomCode: string;
  p2RemoteConnected: boolean;
  remoteTranscriptPreview: string;
  onOpenCategoryEditor: () => void;
  onStartGame: () => void;
}

const AVATARS = ['⚡', '🔥', '🦊', '🐉', '👑', '🤖', '🦈', '🦁', '🥷', '👽', '💎', '🚀'];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  p1,
  p2,
  onUpdatePlayer,
  settings,
  onUpdateSettings,
  categories,
  roomCode,
  p2RemoteConnected,
  remoteTranscriptPreview,
  onOpenCategoryEditor,
  onStartGame,
}) => {
  const [testingMic, setTestingMic] = useState(false);
  const [testTranscript, setTestTranscript] = useState('');
  const [testVolume, setTestVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);

  const speechSupported = SmartSpeechRecognizer.isSupported();

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  const toggleMicTest = () => {
    if (testingMic) {
      recognizerRef.current?.stop();
      setTestingMic(false);
      setTestVolume(0);
      return;
    }

    setMicError(null);
    setTestTranscript('Parla ora nel microfono...');
    const rec = new SmartSpeechRecognizer(
      (alternatives) => {
        setTestTranscript(alternatives[0] || '');
      },
      (listening, err) => {
        setTestingMic(listening);
        if (err) setMicError(err);
      },
      (vol) => setTestVolume(vol)
    );
    recognizerRef.current = rec;
    rec.start();
  };

  const getCompanionUrl = () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?room=${roomCode}`;
  };

  const handleCopyCompanionUrl = () => {
    navigator.clipboard.writeText(getCompanionUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen studio-bg studio-grid-overlay flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Top Broadcast Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-600 to-rose-500 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#060914] rounded-[14px] grid grid-cols-2 gap-1 p-2">
              <div className="bg-cyan-400 rounded-sm animate-pulse" />
              <div className="bg-rose-500 rounded-sm" />
              <div className="bg-rose-500 rounded-sm" />
              <div className="bg-cyan-400 rounded-sm animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 rounded-full">
                TV SHOW EDITION
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-widest bg-rose-500/15 text-rose-300 border border-rose-400/30 rounded-full">
                1v1 VOICE ARENA
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-wider uppercase mt-1 bg-gradient-to-r from-cyan-300 via-white to-rose-400 bg-clip-text text-transparent">
              FLOOR ARENA
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCategoryEditor}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 font-semibold text-sm transition-all"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <span>Categorie & Pack ({categories.length})</span>
          </button>

          <button
            onClick={() =>
              onUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
            className={`p-2.5 rounded-xl border transition-all ${
              settings.soundEnabled
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-slate-800/60 border-white/10 text-slate-400'
            }`}
            title="Effetti Sonori Studio TV (No Copyright)"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Avviso compatibilità Browser STT */}
      {!speechSupported && (
        <div className="max-w-6xl w-full mx-auto mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center gap-3 text-amber-200">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-sm">
            <strong>Attenzione:</strong> Il tuo browser attuale non espone le Web Speech API native. Per il riconoscimento vocale istantaneo apri il gioco su <strong>Google Chrome, Microsoft Edge o Brave</strong> (puoi comunque usare la Barra Spaziatrice per Passare e Invio per dare Buona).
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <main className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Colonna Sinistra: I 2 Sfidanti */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Giocatore 1 */}
          <div className="p-5 rounded-2xl bg-[#091124]/90 border-2 border-cyan-400/50 neon-cyan-box flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold">
                SFIDANTE 1 // TERRITORIO CIANO
              </span>
              <span className="text-2xl">{p1.avatar}</span>
            </div>
            <input
              type="text"
              value={p1.name}
              maxLength={18}
              onChange={(e) => onUpdatePlayer('p1', e.target.value, p1.avatar)}
              placeholder="Nome Giocatore 1..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-cyan-400/40 text-white font-display text-xl font-bold focus:outline-none focus:border-cyan-300"
            />
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((av) => (
                <button
                  key={`p1-${av}`}
                  onClick={() => onUpdatePlayer('p1', p1.name, av)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                    p1.avatar === av
                      ? 'bg-cyan-400 text-black scale-110 font-bold shadow-md shadow-cyan-400/50'
                      : 'bg-white/5 hover:bg-white/15'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Giocatore 2 */}
          <div className="p-5 rounded-2xl bg-[#1f0918]/90 border-2 border-rose-500/50 neon-pink-box flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-rose-300 font-bold">
                SFIDANTE 2 // TERRITORIO MAGENTA
              </span>
              <span className="text-2xl">{p2.avatar}</span>
            </div>
            <input
              type="text"
              value={p2.name}
              maxLength={18}
              onChange={(e) => onUpdatePlayer('p2', e.target.value, p2.avatar)}
              placeholder="Nome Giocatore 2..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-rose-500/40 text-white font-display text-xl font-bold focus:outline-none focus:border-rose-400"
            />
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((av) => (
                <button
                  key={`p2-${av}`}
                  onClick={() => onUpdatePlayer('p2', p2.name, av)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                    p2.avatar === av
                      ? 'bg-rose-500 text-white scale-110 font-bold shadow-md shadow-rose-500/50'
                      : 'bg-white/5 hover:bg-white/15'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonna Destra: Modalità In Presenza vs Discord + Regole + Test Voce */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5 bg-[#080d1a]/90 border border-white/10 rounded-2xl p-6">
          {/* Selettore Modalità In Presenza vs Discord */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
              <Tv className="w-4 h-4 text-cyan-400" />
              COME STATE GIOCANDO OGGI?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ micMode: 'local-shared' as MicMode })}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  settings.micMode === 'local-shared'
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    In Presenza / 1 Mic
                  </span>
                  {settings.micMode === 'local-shared' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Siete nella stessa stanza (o usi già un mix audio su PC). Un unico microfono ascolta entrambi a turni alternati.
                </p>
              </button>

              <button
                onClick={() => onUpdateSettings({ micMode: 'discord-p2p' as MicMode })}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  settings.micMode === 'discord-p2p'
                    ? 'bg-rose-500/15 border-rose-400 text-white shadow-lg shadow-rose-500/10'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-400" />
                    Proietto su Discord
                  </span>
                  {settings.micMode === 'discord-p2p' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Condividi questo schermo su Discord! Manda il link rapido a {p2.name} per collegare il suo microfono in P2P senza cavi virtuali.
                </p>
              </button>
            </div>

            {/* Pannello Link Companion quando è attiva la Modalità Discord */}
            {settings.micMode === 'discord-p2p' && (
              <div className="mt-3 p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono uppercase text-rose-300">
                      STANZA P2P:
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 font-mono font-extrabold text-rose-200 tracking-widest">
                      {roomCode}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                      p2RemoteConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p2RemoteConnected
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                    {p2RemoteConnected
                      ? `${p2.name} CONNESSO!`
                      : `In attesa del mic di ${p2.name}...`}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getCompanionUrl()}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    onClick={handleCopyCompanionUrl}
                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Link Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copia Link per {p2.name}</span>
                      </>
                    )}
                  </button>
                </div>

                {remoteTranscriptPreview && (
                  <div className="text-xs font-mono text-emerald-300 bg-black/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    🎙️ Mic remoto di {p2.name}: &ldquo;{remoteTranscriptPreview}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parametri Griglia & Durata Duello */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                GRANDEZZA THE FLOOR
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['3x3', '3x4', '4x4'] as GridSizeOption[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSettings({ gridSize: size })}
                    className={`py-2 px-3 rounded-xl font-display font-bold text-sm border transition-all ${
                      settings.gridSize === size
                        ? 'bg-indigo-500/25 border-indigo-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {size}
                    <span className="block text-[10px] font-sans font-normal opacity-75">
                      {size === '3x3'
                        ? '9 Caselle'
                        : size === '3x4'
                        ? '12 Caselle'
                        : '16 Caselle'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                TEMPO DUELLO PER GIOCATORE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() =>
                      onUpdateSettings({ duelDurationSeconds: sec })
                    }
                    className={`py-2 px-3 rounded-xl font-display font-bold text-sm border transition-all ${
                      settings.duelDurationSeconds === sec
                        ? 'bg-indigo-500/25 border-indigo-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {sec}s
                    <span className="block text-[10px] font-sans font-normal opacity-75">
                      {sec === 30
                        ? 'Blitz'
                        : sec === 45
                        ? 'Classico TV'
                        : 'Esteso'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Box Test Microfono Live */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic
                  className={`w-4 h-4 ${
                    testingMic
                      ? 'text-emerald-400 animate-pulse'
                      : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  CHECK MICROFONO ANTI-CAZZATE (ITALIANO + INGLESE)
                </span>
              </div>
              <button
                onClick={toggleMicTest}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  testingMic
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {testingMic ? 'Ferma Test' : 'Testa Microfono Ora'}
              </button>
            </div>

            {testingMic && (
              <div className="flex items-center gap-3">
                <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.max(8, testVolume * 100)}%` }}
                  />
                </div>
                <div className="text-sm font-mono text-cyan-200 truncate">
                  &ldquo;{testTranscript}&rdquo;
                </div>
              </div>
            )}

            {micError && (
              <p className="text-xs text-rose-400 font-medium">{micError}</p>
            )}
          </div>

          {/* Pulsante Gigante Inizia Show */}
          <button
            onClick={() => {
              recognizerRef.current?.stop();
              onStartGame();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 hover:from-cyan-400 hover:to-rose-400 text-white font-display font-extrabold text-xl md:text-2xl uppercase tracking-wider shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>ENTRA SUL PAVIMENTO // INIZIA LO SHOW</span>
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Footer Info Comandi */}
      <footer className="max-w-6xl w-full mx-auto pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            🗣️ Di&apos; la risposta a voce o di&apos;{' '}
            <strong className="text-amber-300">&ldquo;PASSO&rdquo;</strong> (-3s)
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            ⌨️ Tasti paracadute: <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Spazio</kbd> = Passo |{' '}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Invio</kbd> = Forza Risposta Esatta
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          100% YOUTUBE SAFE AUDIO • ZERO HOST REQUIRED
        </div>
      </footer>
    </div>
  );
};
