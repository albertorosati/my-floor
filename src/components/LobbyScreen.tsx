import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Copy,
  Check,
  X,
  Download,
  Mic,
  Smartphone,
} from 'lucide-react';
import {
  Category,
  GameMode,
  GameSettings,
  PartyPlayer,
  PlayerConfig,
  TargetWinsOption,
} from '../types/game';
import { SmartSpeechRecognizer } from '../engine/speechRecognition';
import { gameConfig } from '../services/configService';
import { pwaInstallService } from '../services/pwaInstallService';
import { hapticsService } from '../services/hapticsService';
import { t, filterCategories, localizePlayerName } from '../services/i18n';
import { TheFloorBackground } from './TheFloorBackground';

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
  remoteTranscriptPreview?: string;
  onOpenCategoryEditor: () => void;
  onStartGame: () => void;
}

const AVATAR_OPTIONS = [
  '🦊', '🐯', '🐼', '🐸', '🐙', '🦖', '😎', '🤠',
  '👻', '🍕', '⚡', '🔥', '🦁', '🐶', '🐱', '🚀',
];

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarPickerFor, setAvatarPickerFor] = useState<
    'p1' | 'p2' | string | null
  >(null);

  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);
  const availableCategories = filterCategories(categories, settings.language);
  const currentMode: GameMode = settings.mode || 'duel';

  useEffect(() => {
    const unsub = pwaInstallService.subscribe((can) => {
      setCanInstallPwa(can);
    });
    return () => {
      unsub();
      recognizerRef.current?.stop();
    };
  }, []);

  const handleInstallClick = async () => {
    hapticsService.vibrateTap();
    await pwaInstallService.triggerInstall();
  };

  const toggleMicTest = () => {
    if (testingMic) {
      recognizerRef.current?.stop();
      setTestingMic(false);
      setTestVolume(0);
      setTestTranscript('');
      return;
    }

    setTestTranscript(t('lobby.testingMic', settings.language));
    const rec = new SmartSpeechRecognizer(
      (alternatives) => {
        if (alternatives[0]) {
          setTestTranscript(alternatives[0]);
        }
      },
      (listening) => {
        setTestingMic(listening);
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
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isDefaultP1 = p1.name === 'Giocatore 1' || p1.name === 'Player 1';
  const isDefaultP2 = p2.name === 'Giocatore 2' || p2.name === 'Player 2';
  const p1Value = isDefaultP1 ? t('lobby.p1', settings.language) : p1.name;
  const p2Value = isDefaultP2 ? t('lobby.p2', settings.language) : p2.name;

  const handleSelectAvatar = (avatar: string) => {
    if (avatarPickerFor === 'p1') {
      onUpdatePlayer('p1', p1.name, avatar);
    } else if (avatarPickerFor === 'p2') {
      onUpdatePlayer('p2', p2.name, avatar);
    } else if (avatarPickerFor && onUpdatePartyPlayer) {
      const p = partyPlayers.find((item) => item.id === avatarPickerFor);
      if (p) {
        onUpdatePartyPlayer(p.id, p.name, avatar);
      }
    }
    setAvatarPickerFor(null);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between p-4 sm:p-6 select-none overflow-x-hidden">
      {/* 96px Checkerboard Floor Background */}
      <TheFloorBackground stage="neutral" />

      {/* Main Single Container: Max 1100px Centered */}
      <div className="w-full max-w-[1100px] mx-auto flex-1 flex flex-col justify-between py-2 sm:py-4 gap-6">
        {/* ============================================================== */}
        {/* HEADER: HERO STICKER TITLE (LEFT) | SETTINGS BUTTON (RIGHT)    */}
        {/* ============================================================== */}
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow border-[3px] border-ink shadow-hard flex items-center justify-center text-2xl font-black text-ink shrink-0">
              ⚡
            </div>
            {/* Sticker title with hard shadow and -2deg rotation */}
            <h1 className="font-display font-black text-2xl sm:text-4xl text-ink bg-yellow px-4 py-1.5 rounded-2xl border-[3px] border-ink shadow-hard -rotate-2 tracking-wide uppercase">
              THE FLOOR
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label={t('lobby.settings', settings.language)}
            className="btn-push w-12 h-12 rounded-2xl bg-paper border-[3px] border-ink text-ink flex items-center justify-center hover:bg-yellow"
          >
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </button>
        </header>

        {/* ============================================================== */}
        {/* MODE: 3-OPTION SEGMENTED CONTROL (LABEL ONLY)                  */}
        {/* ============================================================== */}
        <div className="card-paper p-1.5 flex gap-2 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => onUpdateSettings({ mode: 'duel' })}
            className={`flex-1 min-h-[44px] py-2.5 rounded-xl font-display font-black text-lg transition-all ${
              currentMode === 'duel'
                ? 'bg-yellow text-ink border-[3px] border-ink shadow-hard-sm'
                : 'bg-transparent text-ink/70 hover:text-ink border-[3px] border-transparent'
            }`}
          >
            1v1
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ mode: 'solo' })}
            className={`flex-1 min-h-[44px] py-2.5 rounded-xl font-display font-black text-lg transition-all ${
              currentMode === 'solo'
                ? 'bg-yellow text-ink border-[3px] border-ink shadow-hard-sm'
                : 'bg-transparent text-ink/70 hover:text-ink border-[3px] border-transparent'
            }`}
          >
            Solo
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ mode: 'party' })}
            className={`flex-1 min-h-[44px] py-2.5 rounded-xl font-display font-black text-lg transition-all ${
              currentMode === 'party'
                ? 'bg-yellow text-ink border-[3px] border-ink shadow-hard-sm'
                : 'bg-transparent text-ink/70 hover:text-ink border-[3px] border-transparent'
            }`}
          >
            Party
          </button>
        </div>

        {/* ============================================================== */}
        {/* 1V1 MODE: FACE-OFF (BLUE CARD vs RED CARD)                     */}
        {/* ============================================================== */}
        {currentMode === 'duel' && (
          <div className="w-full flex flex-col gap-6 max-w-3xl mx-auto">
            {/* The 2 Face-Off Cards */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative">
              {/* Player 1 Card (Blue Left) */}
              <div className="flex-1 w-full bg-blue text-white rounded-card border-[3px] border-ink shadow-hard p-5 sm:p-6 flex flex-col items-center gap-3">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-white/90">
                  {t('lobby.p1', settings.language)}
                </span>
                <button
                  type="button"
                  onClick={() => setAvatarPickerFor('p1')}
                  aria-label="Player 1 Avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-paper text-ink border-[3px] border-ink shadow-hard-sm text-5xl sm:text-6xl flex items-center justify-center hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
                >
                  {p1.avatar}
                </button>
                <input
                  type="text"
                  value={p1Value}
                  maxLength={18}
                  onChange={(e) => onUpdatePlayer('p1', e.target.value, p1.avatar)}
                  placeholder={t('lobby.p1Placeholder', settings.language)}
                  className="w-full bg-paper text-ink border-[3px] border-ink rounded-xl px-3.5 py-2 font-display font-bold text-center text-lg focus:outline-none focus:ring-2 focus:ring-yellow"
                />
              </div>

              {/* Round Yellow VS Badge (Tilted) */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow border-[3px] border-ink shadow-hard flex items-center justify-center text-ink font-display font-black text-2xl rotate-6 shrink-0 my-[-10px] sm:my-0 sm:mx-[-24px] z-10">
                VS
              </div>

              {/* Player 2 Card (Red Right) */}
              <div className="flex-1 w-full bg-red text-white rounded-card border-[3px] border-ink shadow-hard p-5 sm:p-6 flex flex-col items-center gap-3">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-white/90">
                  {t('lobby.p2', settings.language)}
                </span>
                <button
                  type="button"
                  onClick={() => setAvatarPickerFor('p2')}
                  aria-label="Player 2 Avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-paper text-ink border-[3px] border-ink shadow-hard-sm text-5xl sm:text-6xl flex items-center justify-center hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
                >
                  {p2.avatar}
                </button>
                <input
                  type="text"
                  value={p2Value}
                  maxLength={18}
                  onChange={(e) => onUpdatePlayer('p2', e.target.value, p2.avatar)}
                  placeholder={t('lobby.p2Placeholder', settings.language)}
                  className="w-full bg-paper text-ink border-[3px] border-ink rounded-xl px-3.5 py-2 font-display font-bold text-center text-lg focus:outline-none focus:ring-2 focus:ring-yellow"
                />
              </div>
            </div>

            {/* "How do you play?" (Two Selectable Cards) */}
            <div className="flex flex-col gap-2">
              <span className="font-display font-bold text-sm text-paper tracking-wide">
                {t('lobby.howToPlay', settings.language)}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Same Room Card */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ micMode: 'local-shared' })}
                  className={`p-4 rounded-card border-[3px] border-ink text-left transition-all ${
                    settings.micMode === 'local-shared'
                      ? 'bg-yellow text-ink shadow-hard tactile-lifted'
                      : 'bg-paper text-ink shadow-hard-sm hover:translate-y-[-2px]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏠</span>
                    <span className="font-display font-black text-lg">
                      {t('lobby.sameRoom', settings.language)}
                    </span>
                  </div>
                  <p className="text-xs font-sans font-semibold opacity-90 leading-snug">
                    {t('lobby.sameRoomDesc', settings.language)}
                  </p>
                </button>

                {/* On Discord Card */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ micMode: 'discord-p2p' })}
                  className={`p-4 rounded-card border-[3px] border-ink text-left transition-all ${
                    settings.micMode === 'discord-p2p'
                      ? 'bg-yellow text-ink shadow-hard tactile-lifted'
                      : 'bg-paper text-ink shadow-hard-sm hover:translate-y-[-2px]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎧</span>
                        <span className="font-display font-black text-lg">
                          {t('lobby.onDiscord', settings.language)}
                        </span>
                      </div>
                      {p2RemoteConnected && (
                        <span className="px-2 py-0.5 rounded-full bg-green text-ink font-display font-bold text-xs border border-ink">
                          Connected
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-sans font-semibold opacity-90 leading-snug">
                    {t('lobby.onDiscordDesc', settings.language)}
                  </p>
                  {remoteTranscriptPreview && (
                    <div className="mt-2 text-xs font-bold text-ink/75 truncate bg-white/70 px-2 py-1 rounded border border-ink">
                      Mic 2: &ldquo;{remoteTranscriptPreview}&rdquo;
                    </div>
                  )}
                </button>
              </div>

              {settings.micMode === 'discord-p2p' && (
                <div className="card-paper p-3 mt-1 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getCompanionUrl()}
                    className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-white border-[3px] border-ink text-xs text-ink select-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCompanionUrl}
                    className="btn-push px-4 py-2 rounded-xl bg-yellow text-ink font-display font-bold text-xs flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-green" />
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
              )}
            </div>

            {/* Match Settings: Points to win + Time per player */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Points to win */}
              <div className="card-paper p-4 flex flex-col gap-2">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-ink/70">
                  {t('lobby.pointsToWin', settings.language)}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {([3, 5, 7, 0] as TargetWinsOption[]).map((opt) => (
                    <button
                      key={`pts-${opt}`}
                      type="button"
                      onClick={() => onUpdateSettings({ targetWins: opt })}
                      className={`min-h-[44px] py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                        settings.targetWins === opt
                          ? 'bg-yellow text-ink shadow-hard-sm font-black'
                          : 'bg-white text-ink/80 hover:bg-paper font-bold'
                      }`}
                    >
                      {opt === 0 ? t('lobby.freePlay', settings.language) : `${opt} pt`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time per player */}
              <div className="card-paper p-4 flex flex-col gap-2">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-ink/70">
                  {t('lobby.timePerPlayer', settings.language)}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {gameConfig.options.duelDurations.map((sec) => (
                    <button
                      key={`dur-${sec}`}
                      type="button"
                      onClick={() => onUpdateSettings({ duelDurationSeconds: sec })}
                      className={`min-h-[44px] py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                        settings.duelDurationSeconds === sec
                          ? 'bg-yellow text-ink shadow-hard-sm font-black'
                          : 'bg-white text-ink/80 hover:bg-paper font-bold'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Mic link */}
            <div className="text-left">
              <button
                type="button"
                onClick={toggleMicTest}
                className="text-xs font-bold text-paper hover:text-yellow underline cursor-pointer"
              >
                {testingMic
                  ? t('lobby.closeVoiceBtn', settings.language)
                  : t('lobby.testVoiceBtn', settings.language)}
              </button>
              {testingMic && (
                <div className="card-paper p-3 mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic className="w-4 h-4 text-green shrink-0 animate-pulse" />
                    <span className="font-display font-bold text-ink truncate">
                      {testTranscript || t('lobby.testingMic', settings.language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`w-2.5 h-4 rounded-sm border border-ink ${
                        testVolume > 0.05 ? 'bg-green' : 'bg-ink/20'
                      }`}
                    />
                    <span
                      className={`w-2.5 h-6 rounded-sm border border-ink ${
                        testVolume > 0.25 ? 'bg-green' : 'bg-ink/20'
                      }`}
                    />
                    <span
                      className={`w-2.5 h-8 rounded-sm border border-ink ${
                        testVolume > 0.5 ? 'bg-green' : 'bg-ink/20'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ONE BIG YELLOW START BUTTON */}
            <button
              type="button"
              onClick={() => {
                recognizerRef.current?.stop();
                onStartGame();
              }}
              className="btn-push w-full py-4 sm:py-5 rounded-2xl bg-yellow text-ink font-display font-black text-2xl sm:text-3xl border-[3px] border-ink shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed transition-all cursor-pointer uppercase tracking-wider"
            >
              {t('lobby.startDuel', settings.language)}
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* SOLO MODE SETUP                                                */}
        {/* ============================================================== */}
        {currentMode === 'solo' && (
          <div className="card-paper p-6 sm:p-8 flex flex-col gap-6 w-full max-w-xl mx-auto">
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-bold text-sm text-ink/80">
                {t('lobby.playerName', settings.language)}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAvatarPickerFor('p1')}
                  aria-label="Player Avatar"
                  className="w-14 h-14 rounded-2xl bg-white border-[3px] border-ink shadow-hard-sm text-3xl flex items-center justify-center shrink-0 hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  {p1.avatar}
                </button>
                <input
                  type="text"
                  value={p1Value}
                  maxLength={18}
                  onChange={(e) => onUpdatePlayer('p1', e.target.value, p1.avatar)}
                  placeholder={t('lobby.p1Placeholder', settings.language)}
                  className="min-w-0 flex-1 bg-white border-[3px] border-ink rounded-xl px-4 py-2.5 font-display text-lg text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-bold text-sm text-ink/80">
                {t('solo.duration', settings.language)}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {gameConfig.options.soloDurations.slice(0, 4).map((sec) => (
                  <button
                    key={`solo-${sec}`}
                    type="button"
                    onClick={() => onUpdateSettings({ soloDurationSeconds: sec })}
                    className={`min-h-[44px] py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                      settings.soloDurationSeconds === sec
                        ? 'bg-yellow text-ink shadow-hard-sm font-black'
                        : 'bg-white text-ink/80 hover:bg-paper font-bold'
                    }`}
                  >
                    {sec === 0 ? t('solo.durationFree', settings.language) : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Test mic link */}
            <div className="text-left">
              <button
                type="button"
                onClick={toggleMicTest}
                className="text-xs font-bold text-ink hover:text-blue underline cursor-pointer"
              >
                {testingMic
                  ? t('lobby.closeVoiceBtn', settings.language)
                  : t('lobby.testVoiceBtn', settings.language)}
              </button>
              {testingMic && (
                <div className="card-paper p-3 mt-2 flex items-center justify-between text-xs">
                  <span className="font-display font-bold text-ink truncate">
                    {testTranscript || t('lobby.testingMic', settings.language)}
                  </span>
                  <span className="text-[10px] font-bold text-green uppercase">
                    Level: {Math.round(testVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* ONE BIG YELLOW START BUTTON */}
            <button
              type="button"
              onClick={() => {
                recognizerRef.current?.stop();
                onStartGame();
              }}
              className="btn-push w-full py-4 rounded-xl bg-yellow text-ink font-display font-black text-2xl border-[3px] border-ink shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed transition-all mt-2 cursor-pointer uppercase"
            >
              {t('solo.startTraining', settings.language)}
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* PARTY MODE SETUP                                               */}
        {/* ============================================================== */}
        {currentMode === 'party' && (
          <div className="card-paper p-6 sm:p-8 flex flex-col gap-6 w-full max-w-xl mx-auto">
            <div className="flex flex-col gap-2">
              <label className="font-display font-bold text-sm text-ink/80">
                {t('party.players', settings.language, { n: partyPlayers.length })}
              </label>
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {partyPlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvatarPickerFor(player.id)}
                      aria-label="Player Avatar"
                      className="w-10 h-10 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm text-xl flex items-center justify-center shrink-0 hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      {player.avatar}
                    </button>
                    <input
                      type="text"
                      value={localizePlayerName(player.name, settings.language)}
                      maxLength={18}
                      onChange={(e) =>
                        onUpdatePartyPlayer &&
                        onUpdatePartyPlayer(player.id, e.target.value, player.avatar)
                      }
                      placeholder={t('party.playerNamePlaceholder', settings.language)}
                      className="min-w-0 flex-1 bg-white border-[3px] border-ink rounded-xl px-3 py-2 font-display text-base text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
                    />
                    {partyPlayers.length > 3 && onRemovePartyPlayer && (
                      <button
                        type="button"
                        onClick={() => onRemovePartyPlayer(player.id)}
                        aria-label="Remove player"
                        className="w-9 h-9 rounded-xl bg-white border-[3px] border-ink text-red font-black text-sm flex items-center justify-center hover:bg-red hover:text-white"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {partyPlayers.length < 8 && onAddPartyPlayer && (
                <button
                  type="button"
                  onClick={onAddPartyPlayer}
                  className="btn-push py-2.5 rounded-xl bg-paper text-ink font-display font-bold text-sm"
                >
                  {t('party.addPlayer', settings.language)}
                </button>
              )}
            </div>

            {/* Time per turn */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-bold text-sm text-ink/80">
                {t('lobby.timePerPlayer', settings.language)}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {gameConfig.options.duelDurations.map((sec) => (
                  <button
                    key={`dur-${sec}`}
                    type="button"
                    onClick={() => onUpdateSettings({ duelDurationSeconds: sec })}
                    className={`min-h-[44px] py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                      settings.duelDurationSeconds === sec
                        ? 'bg-yellow text-ink shadow-hard-sm font-black'
                        : 'bg-white text-ink/80 hover:bg-paper font-bold'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* ONE BIG YELLOW START BUTTON */}
            <button
              type="button"
              onClick={() => {
                recognizerRef.current?.stop();
                onStartGame();
              }}
              className="btn-push w-full py-4 rounded-xl bg-yellow text-ink font-display font-black text-2xl border-[3px] border-ink shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed transition-all mt-2 cursor-pointer uppercase"
            >
              {t('lobby.startParty', settings.language)}
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECONDARY ACTION: BROWSE CATEGORIES (OPENS SEARCHABLE MODAL)   */}
        {/* ============================================================== */}
        <div className="text-center">
          <button
            type="button"
            onClick={onOpenCategoryEditor}
            className="btn-push px-6 py-2.5 rounded-xl bg-paper text-ink font-display font-bold text-sm"
          >
            {t('home.exploreCategories', settings.language)} ({availableCategories.length})
          </button>
        </div>

        {/* Quiet footer hint */}
        <footer className="text-center text-xs text-paper/70 font-medium py-1">
          {currentMode === 'solo'
            ? t('lobby.footerSolo', settings.language)
            : t('lobby.footerDuel', settings.language)}
        </footer>
      </div>

      {/* ============================================================== */}
      {/* AVATAR POPOVER                                                 */}
      {/* ============================================================== */}
      {avatarPickerFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-xs w-full p-5 animate-pop-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg text-ink">
                Choose Avatar
              </h3>
              <button
                type="button"
                onClick={() => setAvatarPickerFor(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-paper border-[3px] border-ink flex items-center justify-center text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelectAvatar(emoji)}
                  className="w-12 h-12 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm text-2xl flex items-center justify-center hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SETTINGS MODAL (LANGUAGE, SOUND, INSTALL APP)                  */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 flex flex-col gap-5 animate-pop-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-black text-2xl text-ink">
                {t('lobby.settings', settings.language)}
              </h2>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close"
                className="btn-push w-9 h-9 rounded-xl bg-paper text-ink flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-bold text-sm text-ink/80">
                {t('app.language', settings.language)}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ language: 'it' })}
                  className={`py-2 rounded-xl font-display font-bold text-sm border-[3px] border-ink ${
                    settings.language === 'it'
                      ? 'bg-yellow text-ink shadow-hard-sm'
                      : 'bg-white text-ink/80'
                  }`}
                >
                  Italiano
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`py-2 rounded-xl font-display font-bold text-sm border-[3px] border-ink ${
                    settings.language === 'en'
                      ? 'bg-yellow text-ink shadow-hard-sm'
                      : 'bg-white text-ink/80'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between py-2 border-y-[3px] border-ink/20">
              <span className="font-display font-bold text-sm text-ink">
                {t('lobby.sound', settings.language)}
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`btn-push px-3 py-1.5 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 ${
                  settings.soundEnabled ? 'bg-green text-ink' : 'bg-paper text-ink'
                }`}
              >
                {settings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>OFF</span>
                  </>
                )}
              </button>
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between py-2 border-b-[3px] border-ink/20">
              <span className="font-display font-bold text-sm text-ink">
                {t('lobby.haptics', settings.language)}
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
                className={`btn-push px-3 py-1.5 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 ${
                  settings.hapticsEnabled ? 'bg-green text-ink' : 'bg-paper text-ink'
                }`}
              >
                <span>{settings.hapticsEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Install App Button (NO EMOJI) */}
            {canInstallPwa && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn-push w-full py-2.5 rounded-xl bg-paper text-ink font-display font-bold text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{t('app.install', settings.language)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="btn-push w-full py-3 rounded-xl bg-yellow text-ink font-display font-black text-base"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
