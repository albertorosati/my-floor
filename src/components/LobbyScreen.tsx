import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Category,
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarPickerFor, setAvatarPickerFor] = useState<
    'p1' | 'p2' | string | null
  >(null);

  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);
  const availableCategories = filterCategories(categories, settings.language);
  const avatars = gameConfig.players.avatars;
  const currentMode = settings.mode || 'duel';

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
    await pwaInstallService.triggerInstall();
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
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const p1DisplayName = localizePlayerName(p1.name, settings.language);
  const p2DisplayName = localizePlayerName(p2.name, settings.language);

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
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
      <div className="w-full max-w-[960px] mx-auto flex flex-col gap-6">
        {/* ============================================================== */}
        {/* HEADER: LOGO + "The Floor" (LEFT) | ONE SETTINGS BUTTON (RIGHT)*/}
        {/* ============================================================== */}
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="./logo.svg"
              alt="Logo"
              className="w-10 h-10 rounded-xl border-[3px] border-ink shadow-hard-sm"
            />
            <h1 className="font-display font-black text-2xl sm:text-3xl text-paper tracking-wide">
              {gameConfig.appTitle}
            </h1>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            aria-label={t('lobby.settings', settings.language)}
            className="w-11 h-11 rounded-xl bg-paper border-[3px] border-ink shadow-hard-sm flex items-center justify-center text-ink hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* ============================================================== */}
        {/* MODE: 3-OPTION SEGMENTED CONTROL (LABEL ONLY)                  */}
        {/* ============================================================== */}
        <div className="card-paper p-1.5 flex gap-2 w-full max-w-md mx-auto">
          <button
            onClick={() => onUpdateSettings({ mode: 'duel' })}
            className={`flex-1 py-2.5 rounded-xl font-display font-black text-lg transition-all ${
              currentMode === 'duel'
                ? 'bg-yellow text-ink border-[3px] border-ink shadow-hard-sm'
                : 'bg-transparent text-ink/70 hover:text-ink border-[3px] border-transparent'
            }`}
          >
            1v1
          </button>
          <button
            onClick={() => onUpdateSettings({ mode: 'solo' })}
            className={`flex-1 py-2.5 rounded-xl font-display font-black text-lg transition-all ${
              currentMode === 'solo'
                ? 'bg-yellow text-ink border-[3px] border-ink shadow-hard-sm'
                : 'bg-transparent text-ink/70 hover:text-ink border-[3px] border-transparent'
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => onUpdateSettings({ mode: 'party' })}
            className={`flex-1 py-2.5 rounded-xl font-display font-black text-lg transition-all ${
              currentMode === 'party'
                ? 'bg-yellow text-ink border-[3px] border-ink shadow-hard-sm'
                : 'bg-transparent text-ink/70 hover:text-ink border-[3px] border-transparent'
            }`}
          >
            Party
          </button>
        </div>

        {/* ============================================================== */}
        {/* SETUP FORM: SINGLE PAPER CARD (NO NESTED OUTLINED CARDS)       */}
        {/* ============================================================== */}
        <div className="card-paper p-5 sm:p-8 flex flex-col gap-6 w-full max-w-xl mx-auto">
          {/* 1v1 MATCH SETUP */}
          {currentMode === 'duel' && (
            <>
              {/* Player 1 Row */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.p1', settings.language)}
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAvatarPickerFor('p1')}
                    aria-label="Player 1 avatar"
                    className="w-12 h-12 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm text-2xl flex items-center justify-center shrink-0 hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    {p1.avatar}
                  </button>
                  <input
                    type="text"
                    value={p1DisplayName}
                    maxLength={18}
                    onChange={(e) =>
                      onUpdatePlayer('p1', e.target.value, p1.avatar)
                    }
                    placeholder={t('lobby.p1Placeholder', settings.language)}
                    className="min-w-0 flex-1 bg-white border-[3px] border-ink rounded-xl px-3.5 py-2.5 font-display text-base sm:text-lg text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
                  />
                </div>
              </div>

              {/* Player 2 Row */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.p2', settings.language)}
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAvatarPickerFor('p2')}
                    aria-label="Player 2 avatar"
                    className="w-12 h-12 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm text-2xl flex items-center justify-center shrink-0 hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    {p2.avatar}
                  </button>
                  <input
                    type="text"
                    value={p2DisplayName}
                    maxLength={18}
                    onChange={(e) =>
                      onUpdatePlayer('p2', e.target.value, p2.avatar)
                    }
                    placeholder={t('lobby.p2Placeholder', settings.language)}
                    className="min-w-0 flex-1 bg-white border-[3px] border-ink rounded-xl px-3.5 py-2.5 font-display text-base sm:text-lg text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
                  />
                </div>
              </div>

              {/* Room Choice: Same room / Discord */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.howToPlay', settings.language)}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ micMode: 'local-shared' as MicMode })
                    }
                    className={`py-2 px-3 rounded-xl font-display font-bold text-sm border-[3px] border-ink transition-all ${
                      settings.micMode === 'local-shared'
                        ? 'bg-yellow text-ink shadow-hard-sm font-black'
                        : 'bg-white text-ink/80 hover:bg-paper'
                    }`}
                  >
                    {t('lobby.sameRoom', settings.language)}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ micMode: 'discord-p2p' as MicMode })
                    }
                    className={`py-2 px-3 rounded-xl font-display font-bold text-sm border-[3px] border-ink transition-all ${
                      settings.micMode === 'discord-p2p'
                        ? 'bg-yellow text-ink shadow-hard-sm font-black'
                        : 'bg-white text-ink/80 hover:bg-paper'
                    }`}
                  >
                    {t('lobby.onDiscord', settings.language)}
                  </button>
                </div>

                {settings.micMode === 'discord-p2p' && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getCompanionUrl()}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border-[3px] border-ink text-xs text-ink select-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleCopyCompanionUrl}
                      className="px-4 py-2 rounded-xl bg-paper border-[3px] border-ink shadow-hard-sm font-display font-bold text-xs flex items-center gap-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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

              {/* Points to win */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.pointsToWin', settings.language)}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {gameConfig.options.targetWins.map((pts) => (
                    <button
                      key={`pts-${pts}`}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ targetWins: pts as TargetWinsOption })
                      }
                      className={`py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                        settings.targetWins === pts
                          ? 'bg-yellow text-ink shadow-hard-sm font-black'
                          : 'bg-white text-ink/80 hover:bg-paper font-bold'
                      }`}
                    >
                      {pts === 0
                        ? t('lobby.freePlay', settings.language)
                        : `${pts} pt`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time per player */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.timePerPlayer', settings.language)}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {gameConfig.options.duelDurations.map((sec) => (
                    <button
                      key={`sec-${sec}`}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ duelDurationSeconds: sec })
                      }
                      className={`py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
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

              {/* Test mic link */}
              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={toggleMicTest}
                  className="font-bold text-ink/80 underline hover:text-ink cursor-pointer"
                >
                  {testingMic
                    ? t('lobby.closeVoiceBtn', settings.language)
                    : t('lobby.testVoiceBtn', settings.language)}
                </button>
                {testingMic && (
                  <span className="font-bold text-xs text-green truncate max-w-[200px]">
                    {testTranscript || t('lobby.testingMic', settings.language)}
                  </span>
                )}
                {micError && (
                  <span className="font-bold text-xs text-red">{micError}</span>
                )}
              </div>

              {/* ONE BIG YELLOW PRIMARY BUTTON */}
              <button
                type="button"
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="w-full py-4 rounded-xl bg-yellow text-ink font-display font-black text-2xl border-[3px] border-ink shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed transition-all mt-2 cursor-pointer"
              >
                {t('lobby.startDuel', settings.language)}
              </button>
            </>
          )}

          {/* SOLO MODE SETUP */}
          {currentMode === 'solo' && (
            <>
              {/* Player Row */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.playerName', settings.language)}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAvatarPickerFor('p1')}
                    aria-label="Player avatar"
                    className="w-12 h-12 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm text-2xl flex items-center justify-center shrink-0 hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    {p1.avatar}
                  </button>
                  <input
                    type="text"
                    value={p1DisplayName}
                    maxLength={18}
                    onChange={(e) =>
                      onUpdatePlayer('p1', e.target.value, p1.avatar)
                    }
                    placeholder={t('lobby.p1Placeholder', settings.language)}
                    className="min-w-0 flex-1 bg-white border-[3px] border-ink rounded-xl px-3.5 py-2.5 font-display text-base sm:text-lg text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
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
                      onClick={() =>
                        onUpdateSettings({ soloDurationSeconds: sec })
                      }
                      className={`py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                        settings.soloDurationSeconds === sec
                          ? 'bg-yellow text-ink shadow-hard-sm font-black'
                          : 'bg-white text-ink/80 hover:bg-paper font-bold'
                      }`}
                    >
                      {sec === 0
                        ? t('solo.durationFree', settings.language)
                        : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test mic link */}
              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={toggleMicTest}
                  className="font-bold text-ink/80 underline hover:text-ink cursor-pointer"
                >
                  {testingMic
                    ? t('lobby.closeVoiceBtn', settings.language)
                    : t('lobby.testVoiceBtn', settings.language)}
                </button>
                {testingMic && (
                  <span className="font-bold text-xs text-green truncate max-w-[200px]">
                    {testTranscript || t('lobby.testingMic', settings.language)}
                  </span>
                )}
                {micError && (
                  <span className="font-bold text-xs text-red">{micError}</span>
                )}
              </div>

              {/* ONE BIG YELLOW PRIMARY BUTTON */}
              <button
                type="button"
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="w-full py-4 rounded-xl bg-yellow text-ink font-display font-black text-2xl border-[3px] border-ink shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed transition-all mt-2 cursor-pointer"
              >
                {t('solo.startTraining', settings.language)}
              </button>
            </>
          )}

          {/* PARTY MODE SETUP */}
          {currentMode === 'party' && (
            <>
              {/* Players List */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-display font-bold text-sm text-ink/80">
                    {t('party.players', settings.language, {
                      n: partyPlayers.length,
                    })}
                  </label>
                  {partyPlayers.length < 8 && onAddPartyPlayer && (
                    <button
                      type="button"
                      onClick={onAddPartyPlayer}
                      className="px-3 py-1 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm font-display font-bold text-xs flex items-center gap-1 hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('party.addPlayer', settings.language)}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {partyPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => setAvatarPickerFor(player.id)}
                        aria-label="Player avatar"
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
                        className="min-w-0 flex-1 bg-white border-[3px] border-ink rounded-xl px-3 py-2 font-display text-base text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
                      />
                      {partyPlayers.length > 3 && onRemovePartyPlayer && (
                        <button
                          type="button"
                          onClick={() => onRemovePartyPlayer(player.id)}
                          aria-label="Remove player"
                          className="w-10 h-10 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm flex items-center justify-center text-red hover:bg-red hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Points to win */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.pointsToWin', settings.language)}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {gameConfig.options.targetWins.map((pts) => (
                    <button
                      key={`party-pts-${pts}`}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ targetWins: pts as TargetWinsOption })
                      }
                      className={`py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
                        settings.targetWins === pts
                          ? 'bg-yellow text-ink shadow-hard-sm font-black'
                          : 'bg-white text-ink/80 hover:bg-paper font-bold'
                      }`}
                    >
                      {pts === 0
                        ? t('lobby.freePlay', settings.language)
                        : `${pts} pt`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time per duel */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-sm text-ink/80">
                  {t('lobby.timePerPlayer', settings.language)}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {gameConfig.options.duelDurations.map((sec) => (
                    <button
                      key={`party-sec-${sec}`}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ duelDurationSeconds: sec })
                      }
                      className={`py-2 rounded-xl font-display text-sm border-[3px] border-ink transition-all ${
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

              {/* ONE BIG YELLOW PRIMARY BUTTON */}
              <button
                type="button"
                disabled={partyPlayers.length < 3}
                onClick={() => {
                  recognizerRef.current?.stop();
                  onStartGame();
                }}
                className="w-full py-4 rounded-xl bg-yellow text-ink font-display font-black text-2xl border-[3px] border-ink shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-hard-pressed transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('lobby.startParty', settings.language)}
              </button>
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* SECONDARY BUTTON: CHOOSE CATEGORIES (SEARCHABLE MODAL LIST)    */}
        {/* ============================================================== */}
        <button
          type="button"
          onClick={onOpenCategoryEditor}
          className="w-full max-w-xl mx-auto py-3 rounded-xl bg-paper text-ink font-display font-bold text-base border-[3px] border-ink shadow-hard hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm transition-all"
        >
          {t('home.exploreCategories', settings.language)} ({availableCategories.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* QUIET FOOTER                                                   */}
      {/* ============================================================== */}
      <footer className="w-full max-w-[960px] mx-auto text-center text-xs text-paper/60 font-medium py-2">
        {currentMode === 'solo'
          ? t('lobby.footerSolo', settings.language)
          : t('lobby.footerDuel', settings.language)}
      </footer>

      {/* ============================================================== */}
      {/* AVATAR POPOVER MODAL                                           */}
      {/* ============================================================== */}
      {avatarPickerFor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="card-paper max-w-xs w-full p-5 flex flex-col gap-3 relative animate-pop-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink">
                {settings.language === 'en' ? 'Choose avatar' : 'Scegli avatar'}
              </h3>
              <button
                type="button"
                onClick={() => setAvatarPickerFor(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white border-[3px] border-ink flex items-center justify-center hover:bg-yellow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {avatars.map((av) => (
                <button
                  key={`pick-${av}`}
                  type="button"
                  onClick={() => handleSelectAvatar(av)}
                  className="w-11 h-11 rounded-xl bg-white border-[3px] border-ink shadow-hard-sm text-2xl flex items-center justify-center hover:bg-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SETTINGS MODAL (LANGUAGE, SOUND, INSTALL APP LIVE INSIDE IT)   */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="card-paper max-w-sm w-full p-6 flex flex-col gap-4 relative animate-pop-in">
            <div className="flex items-center justify-between border-b-[3px] border-ink pb-3">
              <h3 className="font-display font-black text-xl text-ink">
                {t('lobby.settings', settings.language)}
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white border-[3px] border-ink flex items-center justify-center hover:bg-yellow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Switch */}
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-ink">
                {t('app.language', settings.language)}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ language: 'it' })}
                  className={`px-3 py-1.5 rounded-xl font-display font-bold text-sm border-[3px] border-ink transition-all ${
                    settings.language === 'it'
                      ? 'bg-yellow text-ink shadow-hard-sm'
                      : 'bg-white text-ink/70'
                  }`}
                >
                  Italiano
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`px-3 py-1.5 rounded-xl font-display font-bold text-sm border-[3px] border-ink transition-all ${
                    settings.language === 'en'
                      ? 'bg-yellow text-ink shadow-hard-sm'
                      : 'bg-white text-ink/70'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Sound FX */}
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-ink">
                {t('lobby.sound', settings.language)}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ soundEnabled: !settings.soundEnabled })
                }
                className={`px-3 py-1.5 rounded-xl font-display font-bold text-sm border-[3px] border-ink shadow-hard-sm flex items-center gap-1.5 ${
                  settings.soundEnabled
                    ? 'bg-green text-ink'
                    : 'bg-white text-ink/50'
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

            {/* Haptics */}
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-ink">
                {t('lobby.haptics', settings.language)}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })
                }
                className={`px-3 py-1.5 rounded-xl font-display font-bold text-sm border-[3px] border-ink shadow-hard-sm flex items-center gap-1.5 ${
                  settings.hapticsEnabled
                    ? 'bg-green text-ink'
                    : 'bg-white text-ink/50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{settings.hapticsEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Install App Button if PWA available */}
            {!isStandalone && canInstallPwa && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-2.5 rounded-xl bg-yellow text-ink font-display font-bold text-sm border-[3px] border-ink shadow-hard-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {t('app.install', settings.language)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
