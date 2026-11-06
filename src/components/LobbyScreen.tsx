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
  Download,
  Smartphone,
  X,
  UserPlus,
  Trash2,
  Target,
  Swords,
  Crown,
} from 'lucide-react';
import {
  Category,
  GameMode,
  GameSettings,
  MicMode,
  PartyPlayer,
  PlayerConfig,
  TargetWinsOption,
} from '../types/game';
import { SmartSpeechRecognizer } from '../engine/speechRecognition';
import { gameConfig } from '../services/configService';
import { pwaInstallService } from '../services/pwaInstallService';
import { hapticsService } from '../services/hapticsService';
import { APP_VERSION } from '../config/version';
import { t, filterCategories, localizePlayerName } from '../services/i18n';

interface LobbyScreenProps {
  p1: PlayerConfig;
  p2: PlayerConfig;
  onUpdatePlayer: (id: 'p1' | 'p2', name: string, avatar: string) => void;
  partyPlayers?: PartyPlayer[];
  onAddPartyPlayer?: () => void;
  onRemovePartyPlayer?: (id: string) => void;
  onUpdatePartyPlayer?: (id: string, name: string, avatar: string) => void;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  categories: Category[];
  roomCode: string;
  p2RemoteConnected: boolean;
  remoteTranscriptPreview: string;
  onOpenCategoryEditor: () => void;
  onStartGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  p1,
  p2,
  onUpdatePlayer,
  partyPlayers = [],
  onAddPartyPlayer,
  onRemovePartyPlayer,
  onUpdatePartyPlayer,
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
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);

  const speechSupported = SmartSpeechRecognizer.isSupported();
  const availableCategories = filterCategories(categories, settings.language);
  const totalPhotos = availableCategories.reduce((acc, c) => acc + c.items.length, 0);
  const avatars = gameConfig.players.avatars;

  useEffect(() => {
    const unsub = pwaInstallService.subscribe((can, standalone) => {
      setCanInstallPwa(can);
      setIsStandalone(standalone);
    });
    return () => {
      unsub();
      recognizerRef.current?.stop();
    };
  }, []);

  const handleInstallClick = async () => {
    hapticsService.vibrateTap();
    const result = await pwaInstallService.triggerInstall();
    if (result === 'ios-guide') {
      setShowIosInstallModal(true);
    }
  };

  const toggleMicTest = () => {
    if (testingMic) {
      recognizerRef.current?.stop();
      setTestingMic(false);
      setTestVolume(0);
      return;
    }

    setMicError(null);
    setTestTranscript(t('lobby.micSaySomething', settings.language));
    const rec = new SmartSpeechRecognizer(
      (alternatives) => {
        setTestTranscript(alternatives[0] || '');
      },
      (listening, err) => {
        setTestingMic(listening);
        if (err) setMicError(err);
      },
      (vol) => setTestVolume(vol),
      settings.language || 'it'
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

  const currentMode = settings.mode || 'duel';
  const p1DisplayName = localizePlayerName(p1.name, settings.language);
  const p2DisplayName = localizePlayerName(p2.name, settings.language);

  return (
    <div className="min-h-screen party-stage-bg flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="./logo.svg"
            alt="The Floor Logo"
            className="w-14 h-14 rounded-2xl border-[3px] border-ink shadow-chunky-sm rotate-[-3deg] hover:rotate-0 transition-transform"
          />
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-cream leading-none">
              {gameConfig.appTitle}
            </h1>
            <p className="text-sm text-cream/70 font-medium mt-0.5">
              {t('app.headerStats', settings.language, {
                categories: availableCategories.length,
                photos: totalPhotos.toLocaleString(settings.language === 'en' ? 'en-US' : 'it-IT'),
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selettore Lingua Rapido IT / EN */}
          <button
            onClick={() => {
              hapticsService.vibrateTap();
              onUpdateSettings({
                language: settings.language === 'it' ? 'en' : 'it',
              });
            }}
            className="btn-push px-3 py-2 rounded-xl bg-cream text-ink font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
            title={settings.language === 'it' ? 'Switch to English' : 'Passa alla lingua Italiana'}
          >
            <span className="text-sm">{settings.language === 'it' ? '🇮🇹' : '🇬🇧'}</span>
            <span className="font-extrabold uppercase">{settings.language}</span>
          </button>

          {!isStandalone && canInstallPwa && (
            <button
              onClick={handleInstallClick}
              className="btn-push px-3 py-2 rounded-xl bg-gold text-ink font-display font-bold text-xs flex items-center gap-1.5 shadow-sm"
              title={t('app.install', settings.language)}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('app.install', settings.language)}</span>
            </button>
          )}

          <button
            onClick={onOpenCategoryEditor}
            className="btn-push px-3 sm:px-4 py-2 rounded-xl bg-cream text-ink font-display font-semibold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-p1" />
            <span className="hidden sm:inline">
              {settings.language === 'en' ? 'Categories' : 'Categorie'} ({availableCategories.length})
            </span>
            <span className="sm:hidden">{availableCategories.length}</span>
          </button>

          <button
            onClick={() =>
              onUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
            className={`btn-push p-2 rounded-xl font-bold ${
              settings.soundEnabled
                ? 'bg-mint text-ink'
                : 'bg-[#2f2547] text-cream/60'
            }`}
            title={settings.soundEnabled ? 'Effetti sonori attivi' : 'Audio disattivato'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          <button
            onClick={() =>
              onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })
            }
            className={`btn-push p-2 rounded-xl font-bold ${
              settings.hapticsEnabled
                ? 'bg-gold text-ink'
                : 'bg-[#2f2547] text-cream/40'
            }`}
            title={
              settings.hapticsEnabled
                ? 'Vibrazione tattile attiva'
                : 'Vibrazione tattile disattivata'
            }
          >
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {!speechSupported && (
        <div className="max-w-5xl w-full mx-auto mt-4 p-4 rounded-2xl bg-gold text-ink border-[3px] border-ink shadow-chunky-sm font-semibold text-sm">
          {t('lobby.micBrowserNotice', settings.language)}
        </div>
      )}

      {/* Selettore Modalità di Gioco (Solo / Duello / Party) */}
      <section className="max-w-5xl w-full mx-auto mt-5">
        <div className="card-cream rounded-3xl p-3 border-[3px] border-ink shadow-chunky-sm">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                hapticsService.vibrateTap();
                onUpdateSettings({ mode: 'solo' });
              }}
              className={`py-3 px-2 sm:px-4 rounded-2xl font-display font-extrabold text-xs sm:text-base border-[3px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                currentMode === 'solo'
                  ? 'bg-p1 text-white border-ink shadow-chunky-sm scale-[1.02]'
                  : 'bg-paper text-ink border-transparent hover:border-ink/20'
              }`}
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t('mode.solo', settings.language)}</span>
            </button>

            <button
              onClick={() => {
                hapticsService.vibrateTap();
                onUpdateSettings({ mode: 'duel' });
              }}
              className={`py-3 px-2 sm:px-4 rounded-2xl font-display font-extrabold text-xs sm:text-base border-[3px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                currentMode === 'duel'
                  ? 'bg-p2 text-white border-ink shadow-chunky-sm scale-[1.02]'
                  : 'bg-paper text-ink border-transparent hover:border-ink/20'
              }`}
            >
              <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t('mode.duel', settings.language)}</span>
            </button>

            <button
              onClick={() => {
                hapticsService.vibrateTap();
                onUpdateSettings({ mode: 'party' });
              }}
              className={`py-3 px-2 sm:px-4 rounded-2xl font-display font-extrabold text-xs sm:text-base border-[3px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                currentMode === 'party'
                  ? 'bg-gold text-ink border-ink shadow-chunky-sm scale-[1.02]'
                  : 'bg-paper text-ink border-transparent hover:border-ink/20'
              }`}
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t('mode.party', settings.language)}</span>
            </button>
          </div>

          <p className="text-center text-xs text-ink/75 font-semibold mt-2.5">
            {currentMode === 'solo' && t('mode.soloDesc', settings.language)}
            {currentMode === 'duel' && t('mode.duelDesc', settings.language)}
            {currentMode === 'party' && t('mode.partyDesc', settings.language)}
          </p>
        </div>
      </section>

      {/* Main Content dinamico in base alla Modalità */}
      <main className="max-w-5xl w-full mx-auto my-5">
        {/* ============================================================ */}
        {/* MODALITÀ 1: ALLENAMENTO SOLITARIO (1 GIOCATORE)              */}
        {/* ============================================================ */}
        {currentMode === 'solo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Giocatore Singolo */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="card-cream rounded-3xl overflow-hidden border-[3px] border-ink shadow-chunky-sm">
                <div className="bg-p1 px-5 py-3 border-b-[3px] border-ink flex items-center justify-between text-white">
                  <span className="font-display font-bold text-lg tracking-wide">
                    {t('solo.title', settings.language)}
                  </span>
                  <span className="text-2xl">{p1.avatar}</span>
                </div>
                <div className="p-5 flex flex-col gap-3.5">
                  <label className="text-xs font-bold text-ink/70">
                    {t('lobby.playerName', settings.language)}
                  </label>
                  <input
                    type="text"
                    value={p1DisplayName}
                    maxLength={18}
                    onChange={(e) => onUpdatePlayer('p1', e.target.value, p1.avatar)}
                    placeholder={t('lobby.p1Placeholder', settings.language)}
                    className="w-full px-4 py-2.5 rounded-xl bg-paper border-2 border-ink/25 focus:border-p1 text-ink font-display text-xl font-bold focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {avatars.map((av) => (
                      <button
                        key={`solo-${av}`}
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
            </div>

            {/* Impostazioni Allenamento */}
            <div className="lg:col-span-7 card-cream rounded-3xl p-6 flex flex-col gap-5 border-[3px] border-ink shadow-chunky-sm">
              <div>
                <h3 className="font-display font-bold text-base text-ink mb-2">
                  {t('solo.duration', settings.language)}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {gameConfig.options.soloDurations.map((sec) => (
                    <button
                      key={`solo-dur-${sec}`}
                      onClick={() =>
                        onUpdateSettings({ soloDurationSeconds: sec })
                      }
                      className={`py-3 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 transition-all ${
                        settings.soloDurationSeconds === sec
                          ? 'bg-ink text-cream border-ink shadow-sm'
                          : 'bg-paper text-ink border-ink/20 hover:border-ink/50'
                      }`}
                    >
                      {sec === 0
                        ? settings.language === 'en'
                          ? 'Free'
                          : 'Libera'
                        : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prova microfono */}
              <div className="p-3.5 rounded-2xl bg-paper border-2 border-ink/15 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink/75 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-p1" />
                    {t('lobby.testMic', settings.language)}
                  </span>
                  <button
                    onClick={toggleMicTest}
                    className={`px-3 py-1 rounded-lg font-display font-bold text-xs border-2 border-ink ${
                      testingMic
                        ? 'bg-p2 text-white'
                        : 'bg-white text-ink hover:bg-gold/30'
                    }`}
                  >
                    {testingMic
                      ? t('lobby.closeVoiceBtn', settings.language)
                      : t('lobby.testVoiceBtn', settings.language)}
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

              <button
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="btn-push w-full py-4 px-6 rounded-2xl bg-gold text-ink font-display font-black text-2xl flex items-center justify-center gap-3 border-[3px] border-ink"
              >
                <Target className="w-6 h-6 stroke-[2.5]" />
                <span>{t('solo.startTraining', settings.language)}</span>
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODALITÀ 2: DUELLO CLASSICO 1v1 (2 GIOCATORI)                */}
        {/* ============================================================ */}
        {currentMode === 'duel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Giocatori 1 e 2 */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Card Giocatore 1 */}
              <div className="card-cream rounded-3xl overflow-hidden border-[3px] border-ink shadow-chunky-sm">
                <div className="bg-p1 px-5 py-3 border-b-[3px] border-ink flex items-center justify-between text-white">
                  <span className="font-display font-bold text-lg tracking-wide">
                    {t('lobby.p1', settings.language)}
                  </span>
                  <span className="text-2xl">{p1.avatar}</span>
                </div>
                <div className="p-5 flex flex-col gap-3.5">
                  <input
                    type="text"
                    value={p1DisplayName}
                    maxLength={18}
                    onChange={(e) => onUpdatePlayer('p1', e.target.value, p1.avatar)}
                    placeholder={t('lobby.p1Placeholder', settings.language)}
                    className="w-full px-4 py-2.5 rounded-xl bg-paper border-2 border-ink/25 focus:border-p1 text-ink font-display text-xl font-bold focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {avatars.map((av) => (
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
              <div className="card-cream rounded-3xl overflow-hidden border-[3px] border-ink shadow-chunky-sm">
                <div className="bg-p2 px-5 py-3 border-b-[3px] border-ink flex items-center justify-between text-white">
                  <span className="font-display font-bold text-lg tracking-wide">
                    {t('lobby.p2', settings.language)}
                  </span>
                  <span className="text-2xl">{p2.avatar}</span>
                </div>
                <div className="p-5 flex flex-col gap-3.5">
                  <input
                    type="text"
                    value={p2DisplayName}
                    maxLength={18}
                    onChange={(e) => onUpdatePlayer('p2', e.target.value, p2.avatar)}
                    placeholder={t('lobby.p2Placeholder', settings.language)}
                    className="w-full px-4 py-2.5 rounded-xl bg-paper border-2 border-ink/25 focus:border-p2 text-ink font-display text-xl font-bold focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {avatars.map((av) => (
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

            {/* Impostazioni Duello */}
            <div className="lg:col-span-7 card-cream rounded-3xl p-6 flex flex-col gap-6 border-[3px] border-ink shadow-chunky-sm">
              <div>
                <h2 className="font-display font-bold text-lg text-ink mb-2.5">
                  {t('lobby.howToPlay', settings.language)}
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
                      <span>{t('lobby.sameRoom', settings.language)}</span>
                    </div>
                    <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                      {t('lobby.sameRoomDesc', settings.language)}
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
                      <span>{t('lobby.onDiscord', settings.language)}</span>
                    </div>
                    <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                      {t('lobby.onDiscordDesc', settings.language, { p2: p2DisplayName })}
                    </p>
                  </button>
                </div>

                {settings.micMode === 'discord-p2p' && (
                  <div className="mt-3 p-4 rounded-2xl bg-paper border-2 border-ink flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink/80">
                        {t('lobby.micLinkFor', settings.language, { p2: p2DisplayName })}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-ink ${
                          p2RemoteConnected
                            ? 'bg-mint text-ink'
                            : 'bg-gold/40 text-ink'
                        }`}
                      >
                        {p2RemoteConnected
                          ? t('lobby.connected', settings.language, { p2: p2DisplayName })
                          : t('lobby.waitingConnection', settings.language)}
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
                            <span>{t('lobby.copied', settings.language)}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{t('lobby.copyLink', settings.language)}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {remoteTranscriptPreview && (
                      <div className="text-xs font-semibold text-ink bg-white px-3 py-1.5 rounded-lg border border-ink/20">
                        🎙️ {p2DisplayName}: &ldquo;{remoteTranscriptPreview}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Traguardo & Secondi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-ink/80 mb-2">
                    {t('lobby.pointsToWin', settings.language)}
                  </h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {gameConfig.options.targetWins.map((pts) => (
                      <button
                        key={pts}
                        onClick={() =>
                          onUpdateSettings({ targetWins: pts as TargetWinsOption })
                        }
                        className={`py-2.5 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 transition-all ${
                          settings.targetWins === pts
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-paper text-ink border-ink/20 hover:border-ink/50'
                        }`}
                      >
                        {pts === 0
                          ? settings.language === 'en'
                            ? 'Free'
                            : 'Libera'
                          : `${pts} ${settings.language === 'en' ? 'pts' : 'pt'}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-ink/80 mb-2">
                    {t('lobby.timePerPlayer', settings.language)}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {gameConfig.options.duelDurations.map((sec) => (
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
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prova microfono */}
              <div className="p-3.5 rounded-2xl bg-paper border-2 border-ink/15 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink/75 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-p1" />
                    {t('lobby.testVoicePrompt', settings.language)}
                  </span>
                  <button
                    onClick={toggleMicTest}
                    className={`px-3 py-1 rounded-lg font-display font-bold text-xs border-2 border-ink ${
                      testingMic
                        ? 'bg-p2 text-white'
                        : 'bg-white text-ink hover:bg-gold/30'
                    }`}
                  >
                    {testingMic
                      ? t('lobby.closeVoiceBtn', settings.language)
                      : t('lobby.testVoiceBtn', settings.language)}
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

              <button
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="btn-push w-full py-4 px-6 rounded-2xl bg-gold text-ink font-display font-bold text-2xl flex items-center justify-center gap-3 border-[3px] border-ink"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>{t('lobby.startDuel', settings.language)}</span>
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODALITÀ 3: PARTY TORNEO (3-8 GIOCATORI)                     */}
        {/* ============================================================ */}
        {currentMode === 'party' && (
          <div className="flex flex-col gap-6">
            <div className="card-cream rounded-3xl p-5 sm:p-6 border-[3px] border-ink shadow-chunky-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink">
                    {t('party.players', settings.language, { n: partyPlayers.length })}
                  </h2>
                  <p className="text-xs text-ink/70 font-semibold">
                    {t('lobby.partySub', settings.language)}
                  </p>
                </div>

                {partyPlayers.length < 8 && onAddPartyPlayer && (
                  <button
                    onClick={onAddPartyPlayer}
                    className="btn-push px-4 py-2 rounded-xl bg-mint text-ink font-display font-bold text-sm flex items-center gap-1.5 border-2 border-ink shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('party.addPlayer', settings.language)}</span>
                  </button>
                )}
              </div>

              {/* Griglia Giocatori Party */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {partyPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className="p-3.5 rounded-2xl bg-paper border-2 border-ink flex flex-col gap-2 relative shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-6 h-6 rounded-lg bg-ink text-cream text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{player.avatar}</span>
                      {partyPlayers.length > 3 && onRemovePartyPlayer && (
                        <button
                          onClick={() => onRemovePartyPlayer(player.id)}
                          className="p-1 rounded-lg bg-p2/10 hover:bg-p2 text-p2 hover:text-white transition-colors"
                          title={t('party.removePlayer', settings.language)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={localizePlayerName(player.name, settings.language)}
                      maxLength={18}
                      onChange={(e) =>
                        onUpdatePartyPlayer &&
                        onUpdatePartyPlayer(player.id, e.target.value, player.avatar)
                      }
                      placeholder={t('party.playerNamePlaceholder', settings.language)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-ink/25 focus:border-p1 text-ink font-display font-bold text-sm focus:outline-none"
                    />

                    {/* Avatar picker rapido */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {avatars.slice(0, 8).map((av) => (
                        <button
                          key={`${player.id}-${av}`}
                          onClick={() =>
                            onUpdatePartyPlayer &&
                            onUpdatePartyPlayer(player.id, player.name, av)
                          }
                          className={`w-6 h-6 rounded-md text-xs flex items-center justify-center ${
                            player.avatar === av
                              ? 'bg-ink text-white scale-110'
                              : 'bg-white hover:bg-ink/10'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {partyPlayers.length < 3 && (
                <div className="mt-4 p-3 rounded-xl bg-p2/20 border-2 border-p2 text-p2 font-bold text-xs text-center">
                  ⚠️ {t('party.minPlayersWarning', settings.language)}
                </div>
              )}
            </div>

            {/* Impostazioni Torneo Party */}
            <div className="card-cream rounded-3xl p-5 sm:p-6 border-[3px] border-ink shadow-chunky-sm flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-ink/80 mb-2">
                    {t('lobby.pointsToWin', settings.language)} ({settings.language === 'en' ? 'Wins to triumph' : 'Vittorie per trionfare'})
                  </h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {gameConfig.options.targetWins.map((pts) => (
                      <button
                        key={`party-pts-${pts}`}
                        onClick={() =>
                          onUpdateSettings({ targetWins: pts as TargetWinsOption })
                        }
                        className={`py-2.5 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 transition-all ${
                          settings.targetWins === pts
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-paper text-ink border-ink/20 hover:border-ink/50'
                        }`}
                      >
                        {pts === 0
                          ? settings.language === 'en'
                            ? 'Free'
                            : 'Libera'
                          : `${pts} ${settings.language === 'en' ? 'pts' : 'pt'}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-ink/80 mb-2">
                    {t('lobby.timePerPlayer', settings.language)} {t('lobby.timeInDuels', settings.language)}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {gameConfig.options.duelDurations.map((sec) => (
                      <button
                        key={`party-sec-${sec}`}
                        onClick={() =>
                          onUpdateSettings({ duelDurationSeconds: sec })
                        }
                        className={`py-2.5 px-3 rounded-xl font-display font-bold text-sm border-2 transition-all ${
                          settings.duelDurationSeconds === sec
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-paper text-ink border-ink/20 hover:border-ink/50'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                disabled={partyPlayers.length < 3}
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="btn-push w-full py-4 px-6 rounded-2xl bg-gold text-ink font-display font-black text-2xl flex items-center justify-center gap-3 border-[3px] border-ink disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crown className="w-6 h-6" />
                <span>{t('lobby.startParty', settings.language)}</span>
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-cream/55 pt-3 border-t border-cream/10">
        <p className="text-center sm:text-left">
          {currentMode === 'solo'
            ? t('lobby.footerSolo', settings.language)
            : t('lobby.footerDuel', settings.language)}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            title={`The Floor Game Show — Versione build ${APP_VERSION}`}
            className="px-2.5 py-1 rounded-lg bg-black/30 border border-cream/15 text-cream/80 font-mono font-bold text-[11px] shadow-sm select-all cursor-default"
          >
            v{APP_VERSION}
          </span>
        </div>
      </footer>

      {/* Finestra Modale Guida Installazione iOS Safari */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 bg-[#140e24]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-cream max-w-sm w-full rounded-3xl p-6 text-center flex flex-col items-center gap-4 animate-pop-in relative border-[4px] border-ink">
            <button
              onClick={() => setShowIosInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-paper border border-ink/20 text-ink/70 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gold border-[3px] border-ink shadow-chunky-sm flex items-center justify-center text-3xl">
              📲
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-ink">
                {t('lobby.iosInstallTitle', settings.language)}
              </h3>
              <p className="text-xs text-ink/70 mt-1">
                {t('lobby.iosInstallDesc', settings.language)}
              </p>
            </div>

            <div className="w-full flex flex-col gap-2.5 text-left text-xs font-semibold text-ink bg-paper p-3.5 rounded-2xl border border-ink/20">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-p1 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <span>{t('lobby.iosStep1', settings.language)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-p2 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <span>{t('lobby.iosStep2', settings.language)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="btn-push w-full py-2.5 rounded-xl bg-mint text-ink font-display font-bold text-sm"
            >
              {t('lobby.iosUnderstood', settings.language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
