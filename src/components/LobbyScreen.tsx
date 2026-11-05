import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  Play,
  Layers,
} from 'lucide-react';
import {
  Category,
  GameSettings,
  MicMode,
  PlayerConfig,
  TargetWinsOption,
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

const AVATARS = ['🦊', '🐯', '🐼', '🐸', '🐙', '🦖', '😎', '🤠', '👻', '🍕', '⚡', '🔥'];

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
  const totalPhotos = categories.reduce((acc, c) => acc + c.items.length, 0);

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
    setTestTranscript('Di’ qualcosa...');
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
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="min-h-screen party-stage-bg flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
      {/* Header Caldo e Pulito */}
      <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gold border-[3px] border-ink shadow-chunky-sm grid grid-cols-2 gap-1 p-2 rotate-[-3deg]">
            <div className="bg-p1 rounded-[4px]" />
            <div className="bg-p2 rounded-[4px]" />
            <div className="bg-p2 rounded-[4px]" />
            <div className="bg-p1 rounded-[4px]" />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-cream leading-none">
              The Floor
            </h1>
            <p className="text-sm text-cream/70 font-medium mt-0.5">
              {categories.length} categorie • {totalPhotos.toLocaleString('it-IT')} foto vere
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCategoryEditor}
            className="btn-push px-4 py-2.5 rounded-xl bg-cream text-ink font-display font-semibold text-sm flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-p1" />
            <span>Categorie ({categories.length})</span>
          </button>

          <button
            onClick={() =>
              onUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
            className={`btn-push p-2.5 rounded-xl font-bold ${
              settings.soundEnabled
                ? 'bg-mint text-ink'
                : 'bg-[#2f2547] text-cream/60'
            }`}
            title={settings.soundEnabled ? 'Audio attivo' : 'Audio disattivato'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {!speechSupported && (
        <div className="max-w-5xl w-full mx-auto mt-4 p-4 rounded-2xl bg-gold text-ink border-[3px] border-ink shadow-chunky-sm font-semibold text-sm">
          Per giocare con la voce apri questa pagina su <strong>Chrome, Edge o Brave</strong>.
        </div>
      )}

      {/* Corpo Centrale */}
      <main className="max-w-5xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonna Giocatori */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Card Giocatore 1 */}
          <div className="card-cream rounded-3xl overflow-hidden">
            <div className="bg-p1 px-5 py-3 border-b-[3px] border-ink flex items-center justify-between text-white">
              <span className="font-display font-bold text-lg tracking-wide">
                Giocatore 1
              </span>
              <span className="text-2xl">{p1.avatar}</span>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              <input
                type="text"
                value={p1.name}
                maxLength={18}
                onChange={(e) => onUpdatePlayer('p1', e.target.value, p1.avatar)}
                placeholder="Il tuo nome..."
                className="w-full px-4 py-2.5 rounded-xl bg-paper border-2 border-ink/25 focus:border-p1 text-ink font-display text-xl font-bold focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={`p1-${av}`}
                    onClick={() => onUpdatePlayer('p1', p1.name, av)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-transform ${
                      p1.avatar === av
                        ? 'bg-p1 text-white border-2 border-ink scale-110 shadow-sm'
                        : 'bg-paper hover:bg-ink/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card Giocatore 2 */}
          <div className="card-cream rounded-3xl overflow-hidden">
            <div className="bg-p2 px-5 py-3 border-b-[3px] border-ink flex items-center justify-between text-white">
              <span className="font-display font-bold text-lg tracking-wide">
                Giocatore 2
              </span>
              <span className="text-2xl">{p2.avatar}</span>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              <input
                type="text"
                value={p2.name}
                maxLength={18}
                onChange={(e) => onUpdatePlayer('p2', e.target.value, p2.avatar)}
                placeholder="Nome sfidante..."
                className="w-full px-4 py-2.5 rounded-xl bg-paper border-2 border-ink/25 focus:border-p2 text-ink font-display text-xl font-bold focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={`p2-${av}`}
                    onClick={() => onUpdatePlayer('p2', p2.name, av)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-transform ${
                      p2.avatar === av
                        ? 'bg-p2 text-white border-2 border-ink scale-110 shadow-sm'
                        : 'bg-paper hover:bg-ink/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Colonna Impostazioni & Avvio */}
        <div className="lg:col-span-7 card-cream rounded-3xl p-6 flex flex-col gap-6">
          {/* Dove giocate */}
          <div>
            <h2 className="font-display font-bold text-lg text-ink mb-2.5">
              Come giocate?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() =>
                  onUpdateSettings({ micMode: 'local-shared' as MicMode })
                }
                className={`p-4 rounded-2xl border-[3px] text-left transition-all ${
                  settings.micMode === 'local-shared'
                    ? 'bg-p1Light border-ink shadow-chunky-sm'
                    : 'bg-paper border-transparent hover:border-ink/30'
                }`}
              >
                <div className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <span>🏠</span>
                  <span>Stessa stanza</span>
                </div>
                <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                  Usate un solo microfono per entrambi parlando a turno davanti allo schermo.
                </p>
              </button>

              <button
                onClick={() =>
                  onUpdateSettings({ micMode: 'discord-p2p' as MicMode })
                }
                className={`p-4 rounded-2xl border-[3px] text-left transition-all ${
                  settings.micMode === 'discord-p2p'
                    ? 'bg-p2Light border-ink shadow-chunky-sm'
                    : 'bg-paper border-transparent hover:border-ink/30'
                }`}
              >
                <div className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <span>🎧</span>
                  <span>Su Discord</span>
                </div>
                <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                  Condividi lo schermo su Discord e manda un link rapido a {p2.name || 'Giocatore 2'} per il suo microfono.
                </p>
              </button>
            </div>

            {settings.micMode === 'discord-p2p' && (
              <div className="mt-3 p-4 rounded-2xl bg-paper border-2 border-ink flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink/80">
                    Link microfono per {p2.name || 'Giocatore 2'}:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-ink ${
                      p2RemoteConnected
                        ? 'bg-mint text-ink'
                        : 'bg-gold/40 text-ink'
                    }`}
                  >
                    {p2RemoteConnected
                      ? `✓ ${p2.name} collegato!`
                      : 'In attesa che apra il link...'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getCompanionUrl()}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-ink/20 text-xs font-mono text-ink select-all"
                  />
                  <button
                    onClick={handleCopyCompanionUrl}
                    className="btn-push px-4 py-2 rounded-xl bg-p2 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copia link</span>
                      </>
                    )}
                  </button>
                </div>

                {remoteTranscriptPreview && (
                  <div className="text-xs font-semibold text-ink bg-white px-3 py-1.5 rounded-lg border border-ink/20">
                    🎙️ {p2.name}: &ldquo;{remoteTranscriptPreview}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Punti Vittoria & Secondi Duello */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-ink/80 mb-2">
                Traguardo vittoria
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {([3, 5, 7, 0] as TargetWinsOption[]).map((pts) => (
                  <button
                    key={pts}
                    onClick={() => onUpdateSettings({ targetWins: pts })}
                    className={`py-2.5 px-2 rounded-xl font-display font-bold text-sm border-2 transition-all ${
                      settings.targetWins === pts
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-paper text-ink border-ink/20 hover:border-ink/50'
                    }`}
                  >
                    {pts === 0 ? 'Libera' : `A ${pts}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-ink/80 mb-2">
                Tempo per giocatore
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() =>
                      onUpdateSettings({ duelDurationSeconds: sec })
                    }
                    className={`py-2.5 px-3 rounded-xl font-display font-bold text-sm border-2 transition-all ${
                      settings.duelDurationSeconds === sec
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-paper text-ink border-ink/20 hover:border-ink/50'
                    }`}
                  >
                    {sec} sec
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prova microfono discreta */}
          <div className="p-3.5 rounded-2xl bg-paper border-2 border-ink/15 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink/75 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-p1" />
                Vuoi fare una prova veloce del microfono?
              </span>
              <button
                onClick={toggleMicTest}
                className={`px-3 py-1 rounded-lg font-display font-bold text-xs border-2 border-ink ${
                  testingMic
                    ? 'bg-p2 text-white'
                    : 'bg-white text-ink hover:bg-gold/30'
                }`}
              >
                {testingMic ? 'Chiudi prova' : 'Prova voce'}
              </button>
            </div>

            {testingMic && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-20 h-2.5 bg-ink/15 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-mint transition-all duration-75"
                    style={{ width: `${Math.max(10, testVolume * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-ink truncate">
                  &ldquo;{testTranscript}&rdquo;
                </span>
              </div>
            )}
            {micError && (
              <p className="text-xs text-p2 font-bold">{micError}</p>
            )}
          </div>

          {/* Pulsante Gioca! */}
          <button
            onClick={() => {
              recognizerRef.current?.stop();
              onStartGame();
            }}
            className="btn-push w-full py-4 px-6 rounded-2xl bg-gold text-ink font-display font-bold text-2xl flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Inizia la Sfida!</span>
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Footer semplice e umano */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-cream/55">
        A turno si sceglie una categoria tra 4 carte proposte • Di’ <strong className="text-gold">“Passo”</strong> (o premi Spazio) per cambiare foto con 3 secondi di penalità
      </footer>
    </div>
  );
};
