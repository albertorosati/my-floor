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
  Flame,
  Zap,
  Trophy,
  ArrowRight,
  Radio,
  Gamepad2,
  Tv,
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
import {
  t,
  filterCategories,
  localizePlayerName,
  getCategoryTitle,
} from '../services/i18n';

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
  const totalPhotos = availableCategories.reduce(
    (acc, c) => acc + c.items.reduce((s, it) => s + (it.imageUrls?.length || 1), 0),
    0
  );
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

  // Selezione di 12 categorie in evidenza per il ticker marquee scenografico
  const featuredCategories = availableCategories.slice(0, 14);

  return (
    <div className="min-h-screen broadcast-stage-bg flex flex-col justify-between select-none relative overflow-x-hidden text-cream">
      {/* Sfondo con fasci di luce da studio televisivo */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-bl from-rose-500/10 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* ============================================================== */}
      {/* 1. MASTER BROADCAST HEADER                                    */}
      {/* ============================================================== */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Brand & Broadcast Status */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <img
              src="./logo.svg"
              alt="The Floor Arena"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-white/20 shadow-lg transition-transform group-hover:scale-105"
            />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                {gameConfig.appTitle}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-gold text-ink font-display font-black text-[10px] uppercase tracking-wider">
                ARENA
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-cream/60 mt-0.5">
              <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                ON AIR
              </span>
              <span>•</span>
              <span>
                {t('app.headerStats', settings.language, {
                  categories: availableCategories.length,
                  photos: totalPhotos.toLocaleString(
                    settings.language === 'en' ? 'en-US' : 'it-IT'
                  ),
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center gap-2">
          {/* Selettore Lingua Bilingue */}
          <button
            onClick={() => {
              hapticsService.vibrateTap();
              onUpdateSettings({
                language: settings.language === 'it' ? 'en' : 'it',
              });
            }}
            className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2233] border border-white/15 text-cream font-mono font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            title={
              settings.language === 'it'
                ? 'Switch to English'
                : 'Passa alla lingua Italiana'
            }
          >
            <span className="text-sm">
              {settings.language === 'it' ? '🇮🇹' : '🇬🇧'}
            </span>
            <span className="uppercase tracking-wider">{settings.language}</span>
          </button>

          {/* Sfoglia Archivio Categorie */}
          <button
            onClick={onOpenCategoryEditor}
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2233] border border-white/15 text-cream font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4 text-p1Cyan" />
            <span className="hidden sm:inline">
              {settings.language === 'en' ? 'Categories' : 'Categorie'}
            </span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-black/50 text-gold font-bold">
              {availableCategories.length}
            </span>
          </button>

          {/* Tasto Installazione PWA se disponibile */}
          {!isStandalone && canInstallPwa && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-gold hover:bg-goldBright text-ink font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              title={t('app.install', settings.language)}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {t('app.install', settings.language)}
              </span>
            </button>
          )}

          {/* Toggle Effetti Sonori */}
          <button
            onClick={() =>
              onUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
            className={`p-2 rounded-lg border transition-colors ${
              settings.soundEnabled
                ? 'bg-[#141824] text-mint border-mint/40 hover:bg-[#1a2030]'
                : 'bg-[#141824] text-cream/40 border-white/10 hover:bg-[#1a2030]'
            }`}
            title={
              settings.soundEnabled ? 'Effetti sonori attivi' : 'Audio disattivato'
            }
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Toggle Vibrazione Aptica */}
          <button
            onClick={() =>
              onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })
            }
            className={`p-2 rounded-lg border transition-colors ${
              settings.hapticsEnabled
                ? 'bg-[#141824] text-gold border-gold/40 hover:bg-[#1a2030]'
                : 'bg-[#141824] text-cream/40 border-white/10 hover:bg-[#1a2030]'
            }`}
            title={
              settings.hapticsEnabled
                ? 'Vibrazione tattile attiva'
                : 'Vibrazione tattile disattivata'
            }
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO BROADCAST BANNER & CHYRON TICKER                       */}
      {/* ============================================================== */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded bg-gold/15 text-gold font-mono font-bold text-[11px] uppercase tracking-wider border border-gold/30 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span>{t('home.heroTagline', settings.language)}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
              {t('home.heroTitle', settings.language)}
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-cream/70 font-medium leading-relaxed">
            {t('home.heroSubtitle', settings.language)}
          </p>
        </div>

        {/* Lower-Third Chyron Ticker con Anteprime Fotografiche */}
        <div className="w-full mt-3 overflow-hidden rounded-xl bg-[#0d101a] border border-white/10 p-1.5 flex items-center shadow-inner relative">
          <div className="px-2.5 py-1 rounded bg-gold text-ink font-mono font-black text-[10px] uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1 shadow-sm">
            <span>LIVE CRAWL</span>
            <span className="text-[9px]">►</span>
          </div>

          <div className="overflow-hidden relative flex-1">
            <div className="animate-marquee-scroll flex items-center gap-2">
              {[...featuredCategories, ...featuredCategories].map((cat, idx) => {
                const cover = cat.coverImage || cat.items[0]?.imageUrl;
                return (
                  <div
                    key={`chyron-${cat.id}-${idx}`}
                    onClick={onOpenCategoryEditor}
                    className="px-2.5 py-1 rounded-lg bg-[#141824] hover:bg-[#1f2638] border border-white/10 flex items-center gap-2 text-xs font-bold text-cream/90 cursor-pointer transition-colors shrink-0"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="w-4 h-4 rounded object-cover border border-white/20"
                      />
                    ) : (
                      <span className="text-xs">{cat.icon}</span>
                    )}
                    <span className="truncate max-w-[130px] font-display">
                      {getCategoryTitle(cat, settings.language)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Avviso Microfono Browser */}
      {!speechSupported && (
        <div className="max-w-7xl w-full mx-auto px-4 mt-2">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{t('lobby.micBrowserNotice', settings.language)}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BROADCAST CHANNEL SWITCHER RACK (ANTI-SLOP HARDWARE DECK)  */}
      {/* ============================================================== */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 mt-4">
        <div className="p-2 rounded-2xl bg-[#0b0e18] border border-white/15 shadow-2xl">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-cream/50 uppercase tracking-widest">
              <Radio className="w-3.5 h-3.5 text-gold" />
              <span>CHANNEL MASTER SELECTOR</span>
            </div>
            <span className="text-[10px] font-mono text-cream/40">
              [SYSTEM: READY]
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* CH.01: Duello 1v1 */}
            <button
              onClick={() => {
                hapticsService.vibrateTap();
                onUpdateSettings({ mode: 'duel' });
              }}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-1.5 ${
                currentMode === 'duel'
                  ? 'bg-gradient-to-r from-blue-950/80 to-rose-950/80 border-rose-500/80 shadow-[0_0_20px_rgba(255,0,85,0.25)] ring-1 ring-rose-500'
                  : 'bg-[#111522] border-white/10 hover:border-white/20 text-cream/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-cream/50">
                  CH.01
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    currentMode === 'duel'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-black/40 text-cream/40'
                  }`}
                >
                  {currentMode === 'duel' ? '● ON AIR' : 'STANDBY'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl">⚔️</span>
                <div>
                  <h4 className="font-display font-black text-sm sm:text-base text-white leading-tight">
                    {t('mode.duel', settings.language)}
                  </h4>
                  <p className="text-[11px] text-cream/60 font-medium">
                    {settings.language === 'en'
                      ? '2 Players • Alternate TV clock'
                      : '2 Giocatori • Tempo alternato TV'}
                  </p>
                </div>
              </div>
            </button>

            {/* CH.02: Solo Practice */}
            <button
              onClick={() => {
                hapticsService.vibrateTap();
                onUpdateSettings({ mode: 'solo' });
              }}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-1.5 ${
                currentMode === 'solo'
                  ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-mint shadow-[0_0_20px_rgba(0,229,163,0.25)] ring-1 ring-mint'
                  : 'bg-[#111522] border-white/10 hover:border-white/20 text-cream/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-cream/50">
                  CH.02
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    currentMode === 'solo'
                      ? 'bg-mint text-ink font-black animate-pulse'
                      : 'bg-black/40 text-cream/40'
                  }`}
                >
                  {currentMode === 'solo' ? '● ON AIR' : 'STANDBY'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl">🎯</span>
                <div>
                  <h4 className="font-display font-black text-sm sm:text-base text-white leading-tight">
                    {t('mode.solo', settings.language)}
                  </h4>
                  <p className="text-[11px] text-cream/60 font-medium">
                    {settings.language === 'en'
                      ? '1 Player • Time attack radar'
                      : '1 Giocatore • Record contro il tempo'}
                  </p>
                </div>
              </div>
            </button>

            {/* CH.03: Party Tournament */}
            <button
              onClick={() => {
                hapticsService.vibrateTap();
                onUpdateSettings({ mode: 'party' });
              }}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-1.5 ${
                currentMode === 'party'
                  ? 'bg-gradient-to-r from-amber-950/80 to-orange-950/80 border-gold shadow-[0_0_20px_rgba(255,184,0,0.25)] ring-1 ring-gold'
                  : 'bg-[#111522] border-white/10 hover:border-white/20 text-cream/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-cream/50">
                  CH.03
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    currentMode === 'party'
                      ? 'bg-gold text-ink font-black animate-pulse'
                      : 'bg-black/40 text-cream/40'
                  }`}
                >
                  {currentMode === 'party' ? '● ON AIR' : 'STANDBY'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl">👑</span>
                <div>
                  <h4 className="font-display font-black text-sm sm:text-base text-white leading-tight">
                    {t('mode.party', settings.language)}
                  </h4>
                  <p className="text-[11px] text-cream/60 font-medium">
                    {settings.language === 'en'
                      ? '3-8 Players • Elimination showdown'
                      : '3-8 Giocatori • Torneo ad eliminazione'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. THE ARENA STAGE (FACE-OFF PODIUMS & MATCH CONSOLE)          */}
      {/* ============================================================== */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 my-4">
        {/* ============================================================ */}
        {/* 4A. DUELLO 1v1: PODI CONTRAPPOSTI & CONSOLE CENTRALE          */}
        {/* ============================================================ */}
        {currentMode === 'duel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* P1: PODIO COBALTO (Sinistra) */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0e121e] border-2 border-p1/40 overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-4 py-2.5 flex items-center justify-between text-white border-b border-white/10">
                  <div className="flex items-center gap-2 font-display font-black text-sm uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                    <span>CONTENDER 01 // {t('lobby.p1', settings.language)}</span>
                  </div>
                  <span className="text-2xl drop-shadow">{p1.avatar}</span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                      {t('lobby.playerName', settings.language)}
                    </label>
                    <input
                      type="text"
                      value={p1DisplayName}
                      maxLength={18}
                      onChange={(e) =>
                        onUpdatePlayer('p1', e.target.value, p1.avatar)
                      }
                      placeholder={t('lobby.p1Placeholder', settings.language)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090c15] border border-p1/40 focus:border-p1Cyan text-white font-display text-lg font-bold focus:outline-none focus:ring-2 focus:ring-p1Cyan/30"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1.5">
                      {settings.language === 'en' ? 'PODIUM AVATAR' : 'AVATAR PODIO'}
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {avatars.slice(0, 10).map((av) => (
                        <button
                          key={`p1-${av}`}
                          onClick={() => onUpdatePlayer('p1', p1.name, av)}
                          className={`h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                            p1.avatar === av
                              ? 'bg-p1 text-white border-2 border-p1Cyan shadow-md shadow-p1/50 scale-105'
                              : 'bg-[#141926] border border-white/10 hover:border-white/30 text-white/80 hover:bg-[#1a2030]'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                <span>STAGE LEFT // BLUE TEAM</span>
                <span className="font-bold">READY</span>
              </div>
            </div>

            {/* CENTRO: CONSOLE REGOLE & MEGA BOTTONE AVVIA DUELLO */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0e121e] border-2 border-white/15 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xl">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="font-mono text-xs font-bold text-gold uppercase tracking-wider">
                    MATCH PARAMETERS
                  </span>
                  <span className="font-mono text-[10px] text-cream/40">
                    CODE: {roomCode}
                  </span>
                </div>

                {/* Scelta Modalità Microfono / Stanza */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() =>
                      onUpdateSettings({ micMode: 'local-shared' as MicMode })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.micMode === 'local-shared'
                        ? 'bg-blue-950/70 border-p1Cyan text-white shadow-sm ring-1 ring-p1Cyan'
                        : 'bg-[#090c15] border-white/10 hover:border-white/20 text-cream/70'
                    }`}
                  >
                    <div className="font-display font-bold text-xs flex items-center gap-1.5">
                      <span>🏠</span>
                      <span>{t('lobby.sameRoom', settings.language)}</span>
                    </div>
                    <p className="text-[10px] text-cream/60 mt-0.5 leading-tight">
                      1 Microfono
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({ micMode: 'discord-p2p' as MicMode })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.micMode === 'discord-p2p'
                        ? 'bg-rose-950/70 border-p2Flame text-white shadow-sm ring-1 ring-p2Flame'
                        : 'bg-[#090c15] border-white/10 hover:border-white/20 text-cream/70'
                    }`}
                  >
                    <div className="font-display font-bold text-xs flex items-center gap-1.5">
                      <span>🎧</span>
                      <span>{t('lobby.onDiscord', settings.language)}</span>
                    </div>
                    <p className="text-[10px] text-cream/60 mt-0.5 leading-tight">
                      Link Remoto
                    </p>
                  </button>
                </div>

                {settings.micMode === 'discord-p2p' && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#090c15] border border-white/15 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-cream/70">REMOTE MIC P2P:</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold ${
                          p2RemoteConnected
                            ? 'bg-mint text-ink'
                            : 'bg-gold/30 text-gold'
                        }`}
                      >
                        {p2RemoteConnected ? 'CONNECTED' : 'WAITING'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={getCompanionUrl()}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs font-mono text-cream select-all"
                      />
                      <button
                        onClick={handleCopyCompanionUrl}
                        className="px-3 py-1.5 rounded-lg bg-p2 text-white font-display font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selettori Traguardo Punti & Tempo */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                      {t('lobby.pointsToWin', settings.language)}
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {gameConfig.options.targetWins.map((pts) => (
                        <button
                          key={`pts-${pts}`}
                          onClick={() =>
                            onUpdateSettings({
                              targetWins: pts as TargetWinsOption,
                            })
                          }
                          className={`py-1.5 rounded-lg font-display font-bold text-xs border transition-all ${
                            settings.targetWins === pts
                              ? 'bg-gold text-ink border-gold font-black shadow-md shadow-gold/20'
                              : 'bg-[#090c15] text-cream/70 border-white/10 hover:border-gold/30'
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
                    <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                      {t('lobby.timePerPlayer', settings.language)}
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {gameConfig.options.duelDurations.map((sec) => (
                        <button
                          key={`sec-${sec}`}
                          onClick={() =>
                            onUpdateSettings({ duelDurationSeconds: sec })
                          }
                          className={`py-1.5 rounded-lg font-display font-bold text-xs border transition-all ${
                            settings.duelDurationSeconds === sec
                              ? 'bg-gold text-ink border-gold font-black shadow-md shadow-gold/20'
                              : 'bg-[#090c15] text-cream/70 border-white/10 hover:border-gold/30'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Studio Live Mic VU-Meter */}
                <div className="p-2.5 rounded-xl bg-[#090c15] border border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-cream/60 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-gold" />
                      <span>STUDIO MIC TEST</span>
                    </span>
                    <button
                      onClick={toggleMicTest}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors ${
                        testingMic
                          ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                          : 'bg-white/10 text-cream/80 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {testingMic ? 'STOP' : 'TEST'}
                    </button>
                  </div>

                  {testingMic && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex-1 h-2 bg-black/60 rounded overflow-hidden flex gap-0.5 p-0.5 border border-white/10">
                        {[...Array(12)].map((_, i) => {
                          const active = testVolume * 12 > i;
                          const color =
                            i < 7 ? 'bg-mint' : i < 10 ? 'bg-gold' : 'bg-rose-500';
                          return (
                            <div
                              key={`vu-bar-${i}`}
                              className={`flex-1 h-full rounded-xs transition-opacity ${
                                active ? `${color} opacity-100` : 'bg-white/5 opacity-20'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-mono text-mint truncate max-w-[120px]">
                        &ldquo;{testTranscript}&rdquo;
                      </span>
                    </div>
                  )}
                  {micError && (
                    <p className="text-[11px] text-rose-400 font-mono">{micError}</p>
                  )}
                </div>
              </div>

              {/* Mega Pulsante Lancio Duello */}
              <button
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="btn-push w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-gold to-yellow-400 text-ink font-display font-black text-2xl flex items-center justify-center gap-3 border-[3px] border-ink shadow-[0_8px_0_#926b00,0_12px_30px_rgba(255,184,0,0.5)] active:translate-y-1.5 active:shadow-[0_0_0_#926b00] animate-glow-pulse"
              >
                <Swords className="w-7 h-7 stroke-[2.5]" />
                <span>{t('lobby.startDuel', settings.language)}</span>
                <Sparkles className="w-5 h-5 text-ink" />
              </button>
            </div>

            {/* P2: PODIO ROSSO (Destra) */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0e121e] border-2 border-p2/40 overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-rose-700 to-red-800 px-4 py-2.5 flex items-center justify-between text-white border-b border-white/10">
                  <div className="flex items-center gap-2 font-display font-black text-sm uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-rose-300 animate-ping" />
                    <span>CONTENDER 02 // {t('lobby.p2', settings.language)}</span>
                  </div>
                  <span className="text-2xl drop-shadow">{p2.avatar}</span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                      {t('lobby.playerName', settings.language)}
                    </label>
                    <input
                      type="text"
                      value={p2DisplayName}
                      maxLength={18}
                      onChange={(e) =>
                        onUpdatePlayer('p2', e.target.value, p2.avatar)
                      }
                      placeholder={t('lobby.p2Placeholder', settings.language)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090c15] border border-p2/40 focus:border-p2Flame text-white font-display text-lg font-bold focus:outline-none focus:ring-2 focus:ring-p2Flame/30"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1.5">
                      {settings.language === 'en' ? 'PODIUM AVATAR' : 'AVATAR PODIO'}
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {avatars.slice(0, 10).map((av) => (
                        <button
                          key={`p2-${av}`}
                          onClick={() => onUpdatePlayer('p2', p2.name, av)}
                          className={`h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                            p2.avatar === av
                              ? 'bg-p2 text-white border-2 border-p2Flame shadow-md shadow-p2/50 scale-105'
                              : 'bg-[#141926] border border-white/10 hover:border-white/30 text-white/80 hover:bg-[#1a2030]'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-rose-400">
                <span>STAGE RIGHT // RED TEAM</span>
                <span className="font-bold">READY</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4B. SOLO TRAINING: PODIO RADAR & CONSOLE SPEEDRUN            */}
        {/* ============================================================ */}
        {currentMode === 'solo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Pod Allenamento Singolo */}
            <div className="lg:col-span-5 rounded-2xl bg-[#0e121e] border-2 border-mint/40 overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 flex items-center justify-between text-ink border-b border-white/10 font-display">
                  <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-ink">
                    <Target className="w-5 h-5 text-ink stroke-[2.5]" />
                    <span>SOLO SPEEDRUN POD // {t('solo.title', settings.language)}</span>
                  </div>
                  <span className="text-2xl drop-shadow">{p1.avatar}</span>
                </div>

                <div className="p-5 flex flex-col gap-3.5">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                      {t('lobby.playerName', settings.language)}
                    </label>
                    <input
                      type="text"
                      value={p1DisplayName}
                      maxLength={18}
                      onChange={(e) =>
                        onUpdatePlayer('p1', e.target.value, p1.avatar)
                      }
                      placeholder={t('lobby.p1Placeholder', settings.language)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#090c15] border border-mint/40 focus:border-mint text-white font-display text-lg font-bold focus:outline-none focus:ring-2 focus:ring-mint/20"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1.5">
                      {settings.language === 'en' ? 'SPEEDRUN AVATAR' : 'AVATAR SPEEDRUN'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {avatars.map((av) => (
                        <button
                          key={`solo-av-${av}`}
                          onClick={() => onUpdatePlayer('p1', p1.name, av)}
                          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                            p1.avatar === av
                              ? 'bg-mint text-ink border-2 border-white scale-105 shadow-md shadow-mint/40'
                              : 'bg-[#141926] border border-white/10 text-white/80 hover:border-white/30 hover:bg-[#1a2030]'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-mint">
                <span>TIME ATTACK MATRIX</span>
                <span className="font-bold">SYSTEM ACTIVE</span>
              </div>
            </div>

            {/* Console Impostazioni Tempo & Lancio */}
            <div className="lg:col-span-7 rounded-2xl bg-[#0e121e] border-2 border-white/15 p-5 flex flex-col justify-between gap-5 shadow-2xl">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                  <span className="font-mono text-xs font-bold text-mint uppercase tracking-wider">
                    ⏱️ TIME ATTACK DURATION
                  </span>
                  <span className="font-mono text-[10px] text-cream/40">
                    TARGET: BEAT YOUR BEST
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                  {gameConfig.options.soloDurations.map((sec) => (
                    <button
                      key={`dur-${sec}`}
                      onClick={() =>
                        onUpdateSettings({ soloDurationSeconds: sec })
                      }
                      className={`py-3 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border transition-all ${
                        settings.soloDurationSeconds === sec
                          ? 'bg-mint text-ink border-mint shadow-lg shadow-mint/25 scale-105 font-black'
                          : 'bg-[#090c15] text-cream/70 border-white/10 hover:border-mint/40 hover:text-white'
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

                {/* Studio Live Mic VU-Meter */}
                <div className="p-3 rounded-xl bg-[#090c15] border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-cream/60 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-mint" />
                      <span>{t('lobby.testVoicePrompt', settings.language)}</span>
                    </span>
                    <button
                      onClick={toggleMicTest}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                        testingMic
                          ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                          : 'bg-white/10 text-cream/80 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {testingMic
                        ? t('lobby.closeVoiceBtn', settings.language)
                        : t('lobby.testVoiceBtn', settings.language)}
                    </button>
                  </div>

                  {testingMic && (
                    <div className="flex items-center gap-3 pt-0.5">
                      <div className="w-32 h-2.5 bg-black/60 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/10">
                        <div
                          className="h-full bg-mint shadow-[0_0_12px_#00E5A3] transition-all duration-75"
                          style={{ width: `${Math.max(10, testVolume * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-mint truncate">
                        &ldquo;{testTranscript}&rdquo;
                      </span>
                    </div>
                  )}
                  {micError && (
                    <p className="text-xs text-rose-400 font-mono">{micError}</p>
                  )}
                </div>
              </div>

              {/* Pulsante Lancio Solo Arena */}
              <button
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="btn-push w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-mint to-teal-400 text-ink font-display font-black text-2xl flex items-center justify-center gap-3 border-[3px] border-ink shadow-[0_8px_0_#007a55,0_12px_30px_rgba(0,229,163,0.5)] active:translate-y-1.5 active:shadow-[0_0_0_#007a55] animate-glow-pulse"
              >
                <Target className="w-7 h-7 stroke-[2.5]" />
                <span>{t('solo.startTraining', settings.language)}</span>
                <Sparkles className="w-5 h-5 text-ink" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4C. PARTY TORNEO: ROSTER CONCORRENTI & CONSOLE               */}
        {/* ============================================================ */}
        {currentMode === 'party' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-[#0e121e] border-2 border-gold/40 p-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white flex items-center gap-2">
                    <Crown className="w-6 h-6 text-gold fill-current" />
                    <span>
                      {t('party.players', settings.language, {
                        n: partyPlayers.length,
                      })}
                    </span>
                  </h3>
                  <p className="text-xs text-cream/70 font-medium mt-0.5">
                    {t('lobby.partySub', settings.language)}
                  </p>
                </div>

                {partyPlayers.length < 8 && onAddPartyPlayer && (
                  <button
                    onClick={onAddPartyPlayer}
                    className="px-4 py-2 rounded-xl bg-gold hover:bg-goldBright text-ink font-display font-black text-sm flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('party.addPlayer', settings.language)}</span>
                  </button>
                )}
              </div>

              {/* Griglia Roster Concorrenti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {partyPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className="p-3 rounded-xl bg-[#090c15] border border-white/15 flex flex-col gap-2 relative shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-6 h-6 rounded bg-gold text-ink font-mono text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{player.avatar}</span>
                      {partyPlayers.length > 3 && onRemovePartyPlayer && (
                        <button
                          onClick={() => onRemovePartyPlayer(player.id)}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
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
                        onUpdatePartyPlayer(
                          player.id,
                          e.target.value,
                          player.avatar
                        )
                      }
                      placeholder={t(
                        'party.playerNamePlaceholder',
                        settings.language
                      )}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 focus:border-gold text-white font-display font-bold text-sm focus:outline-none"
                    />

                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {avatars.slice(0, 8).map((av) => (
                        <button
                          key={`${player.id}-${av}`}
                          onClick={() =>
                            onUpdatePartyPlayer &&
                            onUpdatePartyPlayer(player.id, player.name, av)
                          }
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-all ${
                            player.avatar === av
                              ? 'bg-gold text-ink font-black scale-110 shadow-sm'
                              : 'bg-white/10 hover:bg-white/20 text-white'
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
                <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 font-bold text-xs text-center font-mono">
                  ⚠️ {t('party.minPlayersWarning', settings.language)}
                </div>
              )}
            </div>

            {/* Console Torneo & Pulsante Start */}
            <div className="rounded-2xl bg-[#0e121e] border-2 border-white/15 p-5 shadow-2xl flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                    {t('lobby.pointsToWin', settings.language)}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {gameConfig.options.targetWins.map((pts) => (
                      <button
                        key={`party-pts-${pts}`}
                        onClick={() =>
                          onUpdateSettings({
                            targetWins: pts as TargetWinsOption,
                          })
                        }
                        className={`py-2 px-1.5 rounded-xl font-display font-bold text-xs border transition-all ${
                          settings.targetWins === pts
                            ? 'bg-gold text-ink border-gold font-black shadow-lg shadow-gold/25 scale-105'
                            : 'bg-[#090c15] text-cream/75 border-white/10 hover:border-gold/40 hover:text-white'
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
                  <label className="text-[10px] font-mono uppercase tracking-wider text-cream/50 block mb-1">
                    {t('lobby.timePerPlayer', settings.language)} {t('lobby.timeInDuels', settings.language)}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {gameConfig.options.duelDurations.map((sec) => (
                      <button
                        key={`party-sec-${sec}`}
                        onClick={() =>
                          onUpdateSettings({ duelDurationSeconds: sec })
                        }
                        className={`py-2 px-2 rounded-xl font-display font-bold text-xs border transition-all ${
                          settings.duelDurationSeconds === sec
                            ? 'bg-gold text-ink border-gold font-black shadow-lg shadow-gold/25 scale-105'
                            : 'bg-[#090c15] text-cream/75 border-white/10 hover:border-gold/40 hover:text-white'
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
                className="btn-push w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-300 via-gold to-orange-400 text-ink font-display font-black text-2xl flex items-center justify-center gap-3 border-[3px] border-ink shadow-[0_8px_0_#926b00,0_12px_30px_rgba(255,184,0,0.5)] active:translate-y-1.5 active:shadow-[0_0_0_#926b00] animate-glow-pulse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crown className="w-7 h-7 fill-current" />
                <span>{t('lobby.startParty', settings.language)}</span>
                <Sparkles className="w-5 h-5 text-ink" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 5. BROADCAST FOOTER                                            */}
      {/* ============================================================== */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/50 border-t border-white/10">
        <p className="text-center sm:text-left font-mono text-[11px]">
          {currentMode === 'solo'
            ? t('lobby.footerSolo', settings.language)
            : t('lobby.footerDuel', settings.language)}
        </p>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
          <span className="text-cream/40">ENGINE: V{APP_VERSION}</span>
          <span>•</span>
          <span className="text-mint font-bold">STAGE READY</span>
        </div>
      </footer>

      {/* Finestra Modale Guida Installazione iOS Safari */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 bg-[#140e24]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-cream max-w-sm w-full rounded-3xl p-6 text-center flex flex-col items-center gap-4 animate-pop-in relative border-[4px] border-ink shadow-chunky">
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
