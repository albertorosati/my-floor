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
    <div className="min-h-screen party-stage-bg flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Sfondo luminoso con riflettori da studio televisivo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] floor-stage-marquee pointer-events-none -z-0" />

      {/* ============================================================== */}
      {/* HEADER DELLA LOBBY                                            */}
      {/* ============================================================== */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <img
              src="./logo.svg"
              alt="Floor Arena Logo"
              className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl border-[3px] border-ink shadow-chunky transition-transform group-hover:scale-105 group-hover:-rotate-3"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold border border-ink flex items-center justify-center text-[10px] font-black">
              ⚡
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-cream drop-shadow-sm leading-none">
                {gameConfig.appTitle}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-gold text-ink font-display font-black text-[11px] uppercase tracking-wider border border-ink shadow-sm">
                ARENA
              </span>
            </div>
            <p className="text-xs text-cream/75 font-semibold mt-1">
              {t('app.headerStats', settings.language, {
                categories: availableCategories.length,
                photos: totalPhotos.toLocaleString(
                  settings.language === 'en' ? 'en-US' : 'it-IT'
                ),
              })}
            </p>
          </div>
        </div>

        {/* Action Pills & Controls */}
        <div className="flex items-center gap-2">
          {/* Selettore Lingua IT / EN */}
          <button
            onClick={() => {
              hapticsService.vibrateTap();
              onUpdateSettings({
                language: settings.language === 'it' ? 'en' : 'it',
              });
            }}
            className="btn-push px-3 py-2 rounded-xl bg-cream text-ink font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
            title={
              settings.language === 'it'
                ? 'Switch to English'
                : 'Passa alla lingua Italiana'
            }
          >
            <span className="text-base">
              {settings.language === 'it' ? '🇮🇹' : '🇬🇧'}
            </span>
            <span className="uppercase">{settings.language}</span>
          </button>

          {/* Sfoglia Catalogo Categorie */}
          <button
            onClick={onOpenCategoryEditor}
            className="btn-push px-3 sm:px-4 py-2 rounded-xl bg-cream text-ink font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-4 h-4 text-p1" />
            <span className="hidden sm:inline">
              {settings.language === 'en' ? 'Categories' : 'Categorie'} (
              {availableCategories.length})
            </span>
            <span className="sm:hidden">{availableCategories.length}</span>
          </button>

          {/* Tasto Installazione PWA se disponibile */}
          {!isStandalone && canInstallPwa && (
            <button
              onClick={handleInstallClick}
              className="btn-push px-3 py-2 rounded-xl bg-gold text-ink font-display font-bold text-xs flex items-center gap-1.5 shadow-sm"
              title={t('app.install', settings.language)}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('app.install', settings.language)}</span>
            </button>
          )}

          {/* Toggle Audio */}
          <button
            onClick={() =>
              onUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
            className={`btn-push p-2 rounded-xl font-bold ${
              settings.soundEnabled
                ? 'bg-mint text-ink'
                : 'bg-[#2f2547] text-cream/50'
            }`}
            title={
              settings.soundEnabled ? 'Effetti sonori attivi' : 'Audio disattivato'
            }
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Toggle Vibrazione Tattile */}
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

      {/* ============================================================== */}
      {/* HERO SECTION MARQUEE CON STAGE GLOW                           */}
      {/* ============================================================== */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 mt-4 sm:mt-6 text-center flex flex-col items-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gold/90 text-ink font-display font-black text-xs uppercase tracking-wider border-2 border-ink shadow-chunky-sm mb-2 animate-bounce-soft">
          <Flame className="w-3.5 h-3.5 text-p2 fill-current" />
          <span>{t('home.heroTagline', settings.language)}</span>
          <Sparkles className="w-3.5 h-3.5 text-ink" />
        </div>

        {/* Hero Title */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] uppercase leading-none">
          {t('home.heroTitle', settings.language)}
        </h2>

        {/* Hero Subtitle */}
        <p className="max-w-2xl text-xs sm:text-base text-cream/80 font-medium mt-2.5 leading-relaxed">
          {t('home.heroSubtitle', settings.language)}
        </p>

        {/* Ticker Marquee a scorrimento continuo delle categorie con anteprime fotografiche */}
        <div className="w-full mt-4 sm:mt-5 overflow-hidden py-1 relative">
          <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-[#181226] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-[#181226] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee-scroll flex items-center gap-2.5">
            {[...featuredCategories, ...featuredCategories].map((cat, idx) => {
              const cover = cat.coverImage || cat.items[0]?.imageUrl;
              return (
                <div
                  key={`marquee-${cat.id}-${idx}`}
                  onClick={onOpenCategoryEditor}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-gold/20 border border-white/15 backdrop-blur-sm flex items-center gap-2 text-xs font-bold text-cream cursor-pointer transition-colors shadow-sm shrink-0"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="w-5 h-5 rounded-md object-cover border border-white/20"
                    />
                  ) : (
                    <span>{cat.icon}</span>
                  )}
                  <span className="truncate max-w-[120px]">
                    {getCategoryTitle(cat, settings.language)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Avviso Microfono Browser */}
      {!speechSupported && (
        <div className="max-w-5xl w-full mx-auto px-4 mt-3">
          <div className="p-4 rounded-2xl bg-gold text-ink border-[3px] border-ink shadow-chunky-sm font-semibold text-sm">
            {t('lobby.micBrowserNotice', settings.language)}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* I 3 PORTALI DI GIOCO ("SCEGLI COME GIOCARE")                  */}
      {/* ============================================================== */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-black text-sm sm:text-base text-cream/90 uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-gold" />
            <span>{t('home.selectMode', settings.language)}</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Card Portale 1: Solo Training */}
          <button
            onClick={() => {
              hapticsService.vibrateTap();
              onUpdateSettings({ mode: 'solo' });
            }}
            className={`p-4 sm:p-5 rounded-3xl border-[3px] text-left transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group ${
              currentMode === 'solo'
                ? 'bg-gradient-to-b from-teal-500/30 to-[#1e2a38] border-mint text-cream shadow-chunky scale-[1.02] ring-2 ring-mint'
                : 'bg-[#221a36]/90 border-ink hover:border-mint/50 text-cream/80 hover:bg-[#281f3e]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`w-12 h-12 rounded-2xl border-2 border-ink flex items-center justify-center text-2xl shadow-sm ${
                  currentMode === 'solo' ? 'bg-mint text-ink' : 'bg-paper text-ink'
                }`}
              >
                🎯
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  currentMode === 'solo'
                    ? 'bg-mint text-ink border-ink'
                    : 'bg-black/40 text-cream/70 border-white/10'
                }`}
              >
                {t('home.soloBadge', settings.language)}
              </span>
            </div>

            <div>
              <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-mint transition-colors">
                {t('mode.solo', settings.language)}
              </h4>
              <p className="text-xs text-cream/70 mt-1 line-clamp-2 leading-relaxed">
                {t('mode.soloDesc', settings.language)}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-mint">
              <span>{t('home.soloFeature', settings.language)}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Card Portale 2: Duello Classico 1v1 */}
          <button
            onClick={() => {
              hapticsService.vibrateTap();
              onUpdateSettings({ mode: 'duel' });
            }}
            className={`p-4 sm:p-5 rounded-3xl border-[3px] text-left transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group ${
              currentMode === 'duel'
                ? 'bg-gradient-to-b from-rose-500/30 to-[#381e28] border-p2 text-cream shadow-chunky scale-[1.02] ring-2 ring-p2'
                : 'bg-[#221a36]/90 border-ink hover:border-p2/50 text-cream/80 hover:bg-[#281f3e]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`w-12 h-12 rounded-2xl border-2 border-ink flex items-center justify-center text-2xl shadow-sm ${
                  currentMode === 'duel' ? 'bg-p2 text-white' : 'bg-paper text-ink'
                }`}
              >
                ⚔️
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  currentMode === 'duel'
                    ? 'bg-p2 text-white border-ink'
                    : 'bg-black/40 text-cream/70 border-white/10'
                }`}
              >
                {t('home.duelBadge', settings.language)}
              </span>
            </div>

            <div>
              <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-p2 transition-colors">
                {t('mode.duel', settings.language)}
              </h4>
              <p className="text-xs text-cream/70 mt-1 line-clamp-2 leading-relaxed">
                {t('mode.duelDesc', settings.language)}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-p2">
              <span>{t('home.duelFeature', settings.language)}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Card Portale 3: Party Arena */}
          <button
            onClick={() => {
              hapticsService.vibrateTap();
              onUpdateSettings({ mode: 'party' });
            }}
            className={`p-4 sm:p-5 rounded-3xl border-[3px] text-left transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group ${
              currentMode === 'party'
                ? 'bg-gradient-to-b from-amber-500/30 to-[#382d1e] border-gold text-cream shadow-chunky scale-[1.02] ring-2 ring-gold'
                : 'bg-[#221a36]/90 border-ink hover:border-gold/50 text-cream/80 hover:bg-[#281f3e]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`w-12 h-12 rounded-2xl border-2 border-ink flex items-center justify-center text-2xl shadow-sm ${
                  currentMode === 'party' ? 'bg-gold text-ink' : 'bg-paper text-ink'
                }`}
              >
                👑
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  currentMode === 'party'
                    ? 'bg-gold text-ink border-ink'
                    : 'bg-black/40 text-cream/70 border-white/10'
                }`}
              >
                {t('home.partyBadge', settings.language)}
              </span>
            </div>

            <div>
              <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-gold transition-colors">
                {t('mode.party', settings.language)}
              </h4>
              <p className="text-xs text-cream/70 mt-1 line-clamp-2 leading-relaxed">
                {t('mode.partyDesc', settings.language)}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-gold">
              <span>{t('home.partyFeature', settings.language)}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* DOCK DI CONFIGURAZIONE DELLA MODALITÀ ATTIVA                  */}
      {/* ============================================================== */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 my-5 sm:my-6">
        {/* ============================================================ */}
        {/* 1. CONFIGURAZIONE ALLENAMENTO SOLITARIO (1 GIOCATORE)         */}
        {/* ============================================================ */}
        {currentMode === 'solo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Profilo Giocatore Singolo */}
            <div className="lg:col-span-5 bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 border-b-2 border-white/10 flex items-center justify-between text-ink font-display">
                <span className="font-black text-lg tracking-wide flex items-center gap-2 text-ink">
                  <Target className="w-5 h-5 text-ink stroke-[2.5]" />
                  <span>{t('solo.title', settings.language)}</span>
                </span>
                <span className="text-3xl filter drop-shadow-sm">{p1.avatar}</span>
              </div>
              <div className="p-5 flex flex-col gap-3.5">
                <label className="text-xs font-black text-cream/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-mint" />
                  <span>{t('lobby.playerName', settings.language)}</span>
                </label>
                <input
                  type="text"
                  value={p1DisplayName}
                  maxLength={18}
                  onChange={(e) =>
                    onUpdatePlayer('p1', e.target.value, p1.avatar)
                  }
                  placeholder={t('lobby.p1Placeholder', settings.language)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#120c22] border-2 border-mint/40 focus:border-mint text-white font-display text-xl font-bold focus:outline-none focus:ring-2 focus:ring-mint/20 placeholder:text-white/30"
                />
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-cream/50 uppercase tracking-wide block mb-2">
                    {settings.language === 'en' ? 'Choose Avatar' : 'Scegli Avatar'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {avatars.map((av) => (
                      <button
                        key={`solo-${av}`}
                        onClick={() => onUpdatePlayer('p1', p1.name, av)}
                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                          p1.avatar === av
                            ? 'bg-mint text-ink border-2 border-white scale-110 shadow-lg shadow-mint/30 ring-2 ring-mint'
                            : 'bg-[#120c22] border border-white/10 text-white/80 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Impostazioni Tempo & Prova Microfono */}
            <div className="lg:col-span-7 bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
              <div>
                <h3 className="font-display font-black text-xs text-cream/75 mb-2.5 uppercase tracking-wider flex items-center gap-2">
                  <span>⏱️</span>
                  <span>{t('solo.duration', settings.language)}</span>
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
                          ? 'bg-mint text-ink border-mint shadow-lg shadow-mint/25 scale-105 font-black'
                          : 'bg-[#120c22] text-cream/75 border-white/10 hover:border-mint/40 hover:text-white'
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

              {/* Box Microfono con Livello Live */}
              <div className="p-4 rounded-2xl bg-[#120c22] border border-white/15 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cream/80 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-mint" />
                    <span>{t('lobby.testVoicePrompt', settings.language)}</span>
                  </span>
                  <button
                    onClick={toggleMicTest}
                    className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs border transition-all ${
                      testingMic
                        ? 'bg-p2 text-white border-p2 animate-pulse'
                        : 'bg-white/10 text-cream border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {testingMic
                      ? t('lobby.closeVoiceBtn', settings.language)
                      : t('lobby.testVoiceBtn', settings.language)}
                  </button>
                </div>

                {testingMic && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-28 h-2.5 bg-black/50 rounded-full overflow-hidden shrink-0 border border-white/10">
                      <div
                        className="h-full bg-mint shadow-[0_0_12px_#00E5A3] transition-all duration-75"
                        style={{ width: `${Math.max(10, testVolume * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-mint truncate">
                      &ldquo;{testTranscript}&rdquo;
                    </span>
                  </div>
                )}
                {micError && (
                  <p className="text-xs text-p2 font-bold">{micError}</p>
                )}
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
        {/* 2. CONFIGURAZIONE DUELLO CLASSICO 1v1 (2 GIOCATORI)          */}
        {/* ============================================================ */}
        {currentMode === 'duel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Giocatori P1 e P2 */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Card Giocatore 1 */}
              <div className="bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 border-b-2 border-white/10 flex items-center justify-between text-white font-display">
                  <span className="font-black text-base tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-300 animate-ping" />
                    <span>{t('lobby.p1', settings.language)}</span>
                  </span>
                  <span className="text-2xl filter drop-shadow-sm">{p1.avatar}</span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={p1DisplayName}
                    maxLength={18}
                    onChange={(e) =>
                      onUpdatePlayer('p1', e.target.value, p1.avatar)
                    }
                    placeholder={t('lobby.p1Placeholder', settings.language)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#120c22] border-2 border-blue-500/40 focus:border-blue-400 text-white font-display text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-white/30"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {avatars.slice(0, 10).map((av) => (
                      <button
                        key={`p1-${av}`}
                        onClick={() => onUpdatePlayer('p1', p1.name, av)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                          p1.avatar === av
                            ? 'bg-blue-600 text-white border-2 border-white scale-110 shadow-md shadow-blue-500/40'
                            : 'bg-[#120c22] border border-white/10 text-white/80 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Giocatore 2 */}
              <div className="bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 border-b-2 border-white/10 flex items-center justify-between text-white font-display">
                  <span className="font-black text-base tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-300 animate-ping" />
                    <span>{t('lobby.p2', settings.language)}</span>
                  </span>
                  <span className="text-2xl filter drop-shadow-sm">{p2.avatar}</span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={p2DisplayName}
                    maxLength={18}
                    onChange={(e) =>
                      onUpdatePlayer('p2', e.target.value, p2.avatar)
                    }
                    placeholder={t('lobby.p2Placeholder', settings.language)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#120c22] border-2 border-rose-500/40 focus:border-rose-400 text-white font-display text-lg font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:text-white/30"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {avatars.slice(0, 10).map((av) => (
                      <button
                        key={`p2-${av}`}
                        onClick={() => onUpdatePlayer('p2', p2.name, av)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                          p2.avatar === av
                            ? 'bg-rose-600 text-white border-2 border-white scale-110 shadow-md shadow-rose-500/40'
                            : 'bg-[#120c22] border border-white/10 text-white/80 hover:border-white/30 hover:bg-white/5'
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
            <div className="lg:col-span-7 bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl p-5 sm:p-6 flex flex-col gap-5 shadow-2xl">
              <div>
                <h3 className="font-display font-black text-xs text-cream/75 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🕹️</span>
                  <span>{t('lobby.howToPlay', settings.language)}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      onUpdateSettings({ micMode: 'local-shared' as MicMode })
                    }
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      settings.micMode === 'local-shared'
                        ? 'bg-blue-950/60 border-blue-400 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/50'
                        : 'bg-[#120c22] border-white/10 hover:border-white/25 text-cream/75'
                    }`}
                  >
                    <div className="font-display font-bold text-sm text-white flex items-center gap-2">
                      <span className="text-base">🏠</span>
                      <span>{t('lobby.sameRoom', settings.language)}</span>
                    </div>
                    <p className="text-[11px] text-cream/70 mt-1 leading-relaxed">
                      {t('lobby.sameRoomDesc', settings.language)}
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({ micMode: 'discord-p2p' as MicMode })
                    }
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      settings.micMode === 'discord-p2p'
                        ? 'bg-rose-950/60 border-rose-400 text-white shadow-lg shadow-rose-500/20 ring-1 ring-rose-400/50'
                        : 'bg-[#120c22] border-white/10 hover:border-white/25 text-cream/75'
                    }`}
                  >
                    <div className="font-display font-bold text-sm text-white flex items-center gap-2">
                      <span className="text-base">🎧</span>
                      <span>{t('lobby.onDiscord', settings.language)}</span>
                    </div>
                    <p className="text-[11px] text-cream/70 mt-1 leading-relaxed">
                      {t('lobby.onDiscordDesc', settings.language, {
                        p2: p2DisplayName,
                      })}
                    </p>
                  </button>
                </div>

                {settings.micMode === 'discord-p2p' && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-[#120c22] border border-white/15 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-cream/80">
                        {t('lobby.micLinkFor', settings.language, {
                          p2: p2DisplayName,
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          p2RemoteConnected
                            ? 'bg-mint text-ink border-mint shadow-sm'
                            : 'bg-gold/30 text-gold border-gold/40'
                        }`}
                      >
                        {p2RemoteConnected
                          ? t('lobby.connected', settings.language, {
                              p2: p2DisplayName,
                            })
                          : t('lobby.waitingConnection', settings.language)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getCompanionUrl()}
                        className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs font-mono text-cream select-all focus:outline-none"
                      />
                      <button
                        onClick={handleCopyCompanionUrl}
                        className="btn-push px-4 py-2 rounded-xl bg-p2 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('lobby.copied', settings.language)}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t('lobby.copyLink', settings.language)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Traguardo Punti & Secondi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-display font-black text-xs text-cream/75 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>{t('lobby.pointsToWin', settings.language)}</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {gameConfig.options.targetWins.map((pts) => (
                      <button
                        key={pts}
                        onClick={() =>
                          onUpdateSettings({
                            targetWins: pts as TargetWinsOption,
                          })
                        }
                        className={`py-2 px-1.5 rounded-xl font-display font-bold text-xs border-2 transition-all ${
                          settings.targetWins === pts
                            ? 'bg-gold text-ink border-gold font-black shadow-lg shadow-gold/25 scale-105'
                            : 'bg-[#120c22] text-cream/75 border-white/10 hover:border-gold/40 hover:text-white'
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
                  <h3 className="font-display font-black text-xs text-cream/75 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⏱️</span>
                    <span>{t('lobby.timePerPlayer', settings.language)}</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {gameConfig.options.duelDurations.map((sec) => (
                      <button
                        key={sec}
                        onClick={() =>
                          onUpdateSettings({ duelDurationSeconds: sec })
                        }
                        className={`py-2 px-2 rounded-xl font-display font-bold text-xs border-2 transition-all ${
                          settings.duelDurationSeconds === sec
                            ? 'bg-gold text-ink border-gold font-black shadow-lg shadow-gold/25 scale-105'
                            : 'bg-[#120c22] text-cream/75 border-white/10 hover:border-gold/40 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prova Rapida Microfono */}
              <div className="p-3.5 rounded-2xl bg-[#120c22] border border-white/15 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cream/80 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-p1" />
                    <span>{t('lobby.testVoicePrompt', settings.language)}</span>
                  </span>
                  <button
                    onClick={toggleMicTest}
                    className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs border transition-all ${
                      testingMic
                        ? 'bg-p2 text-white border-p2 animate-pulse'
                        : 'bg-white/10 text-cream border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {testingMic
                      ? t('lobby.closeVoiceBtn', settings.language)
                      : t('lobby.testVoiceBtn', settings.language)}
                  </button>
                </div>

                {testingMic && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-28 h-2.5 bg-black/50 rounded-full overflow-hidden shrink-0 border border-white/10">
                      <div
                        className="h-full bg-mint shadow-[0_0_12px_#00E5A3] transition-all duration-75"
                        style={{ width: `${Math.max(10, testVolume * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-mint truncate">
                      &ldquo;{testTranscript}&rdquo;
                    </span>
                  </div>
                )}
                {micError && (
                  <p className="text-xs text-p2 font-bold">{micError}</p>
                )}
              </div>

              {/* Pulsante Lancio Duello */}
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
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. CONFIGURAZIONE PARTY TORNEO (3-8 GIOCATORI)               */}
        {/* ============================================================ */}
        {currentMode === 'party' && (
          <div className="flex flex-col gap-5">
            <div className="bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-cream flex items-center gap-2">
                    <Crown className="w-6 h-6 text-gold fill-current" />
                    <span>
                      {t('party.players', settings.language, {
                        n: partyPlayers.length,
                      })}
                    </span>
                  </h3>
                  <p className="text-xs text-cream/70 font-semibold mt-0.5">
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
                    className="p-3.5 rounded-2xl bg-[#120c22] border border-white/15 flex flex-col gap-2 relative shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-6 h-6 rounded-lg bg-gold text-ink text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{player.avatar}</span>
                      {partyPlayers.length > 3 && onRemovePartyPlayer && (
                        <button
                          onClick={() => onRemovePartyPlayer(player.id)}
                          className="p-1 rounded-lg bg-p2/20 hover:bg-p2 text-p2 hover:text-white transition-colors"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 focus:border-gold text-white font-display font-bold text-sm focus:outline-none"
                    />

                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {avatars.slice(0, 8).map((av) => (
                        <button
                          key={`${player.id}-${av}`}
                          onClick={() =>
                            onUpdatePartyPlayer &&
                            onUpdatePartyPlayer(player.id, player.name, av)
                          }
                          className={`w-6 h-6 rounded-md text-xs flex items-center justify-center transition-all ${
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
                <div className="mt-4 p-3 rounded-xl bg-p2/20 border-2 border-p2 text-rose-300 font-bold text-xs text-center">
                  ⚠️ {t('party.minPlayersWarning', settings.language)}
                </div>
              )}
            </div>

            {/* Impostazioni Torneo & Pulsante Start */}
            <div className="bg-[#1a132c]/95 border-2 border-white/15 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-display font-black text-xs text-cream/75 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>
                      {t('lobby.pointsToWin', settings.language)}{' '}
                      <span className="text-cream/50 font-medium">
                        ({settings.language === 'en' ? 'Wins to champion' : 'Vittorie per il trionfo'})
                      </span>
                    </span>
                  </h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {gameConfig.options.targetWins.map((pts) => (
                      <button
                        key={`party-pts-${pts}`}
                        onClick={() =>
                          onUpdateSettings({
                            targetWins: pts as TargetWinsOption,
                          })
                        }
                        className={`py-2 px-1.5 rounded-xl font-display font-bold text-xs border-2 transition-all ${
                          settings.targetWins === pts
                            ? 'bg-gold text-ink border-gold font-black shadow-lg shadow-gold/25 scale-105'
                            : 'bg-[#120c22] text-cream/75 border-white/10 hover:border-gold/40 hover:text-white'
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
                  <h3 className="font-display font-black text-xs text-cream/75 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⏱️</span>
                    <span>
                      {t('lobby.timePerPlayer', settings.language)}{' '}
                      {t('lobby.timeInDuels', settings.language)}
                    </span>
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {gameConfig.options.duelDurations.map((sec) => (
                      <button
                        key={`party-sec-${sec}`}
                        onClick={() =>
                          onUpdateSettings({ duelDurationSeconds: sec })
                        }
                        className={`py-2 px-2 rounded-xl font-display font-bold text-xs border-2 transition-all ${
                          settings.duelDurationSeconds === sec
                            ? 'bg-gold text-ink border-gold font-black shadow-lg shadow-gold/25 scale-105'
                            : 'bg-[#120c22] text-cream/75 border-white/10 hover:border-gold/40 hover:text-white'
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
      {/* FOOTER DELLA LOBBY                                            */}
      {/* ============================================================== */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-cream/60 border-t border-cream/10">
        <p className="text-center sm:text-left font-medium">
          {currentMode === 'solo'
            ? t('lobby.footerSolo', settings.language)
            : t('lobby.footerDuel', settings.language)}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span
            title={`The Floor Game Show — Build ${APP_VERSION}`}
            className="px-2.5 py-1 rounded-lg bg-black/40 border border-cream/15 text-cream/80 font-mono font-bold text-[11px] shadow-sm select-all cursor-default"
          >
            v{APP_VERSION}
          </span>
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
