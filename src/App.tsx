import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Category,
  DuelSummary,
  GameSettings,
  PlayerConfig,
  PlayerId,
  RemoteMicPacket,
  AppLanguage,
} from './types/game';
import { loadAllCategories } from './data/categories';
import { gameConfig } from './services/configService';
import { CategoryRepository } from './services/categoryRepository';
import { DiscordHostPeer, generateRoomCode } from './engine/discordMicSync';
import { soundEngine } from './engine/soundEffects';
import { hapticsService } from './services/hapticsService';
import { localizeCategoryForGame } from './services/i18n';
import { LobbyScreen } from './components/LobbyScreen';
import { CategoryDraftScreen } from './components/CategoryDraftScreen';
import { DuelArenaScreen } from './components/DuelArenaScreen';
import { RemoteMicScreen } from './components/RemoteMicScreen';
import { CategoryEditorModal } from './components/CategoryEditorModal';
import { VictoryScreen } from './components/VictoryScreen';

type ScreenState = 'lobby' | 'draft' | 'duel' | 'victory';

export const App: React.FC = () => {
  const [remoteRoomParam] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    return r ? r.toUpperCase().trim() : null;
  });

  const [screen, setScreen] = useState<ScreenState>('lobby');
  const [categories, setCategories] = useState<Category[]>(() =>
    loadAllCategories()
  );
  const [editorOpen, setEditorOpen] = useState(false);

  const [p1, setP1] = useState<PlayerConfig>({
    id: 'p1',
    name: gameConfig.players.defaultP1.name,
    avatar: gameConfig.players.defaultP1.avatar,
  });

  const [p2, setP2] = useState<PlayerConfig>({
    id: 'p2',
    name: gameConfig.players.defaultP2.name,
    avatar: gameConfig.players.defaultP2.avatar,
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    let initialLang: AppLanguage = 'it';
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('the_floor_lang');
      if (saved === 'it' || saved === 'en') {
        initialLang = saved;
      } else if (navigator.language && !navigator.language.startsWith('it')) {
        initialLang = 'en';
      }
    }
    return {
      targetWins: gameConfig.defaults.targetWins,
      duelDurationSeconds: gameConfig.defaults.duelDurationSeconds,
      passPenaltySeconds: gameConfig.defaults.passPenaltySeconds,
      micMode: gameConfig.defaults.micMode,
      soundEnabled: gameConfig.defaults.soundEnabled,
      announcerEnabled: gameConfig.defaults.announcerEnabled,
      hapticsEnabled: true,
      language: initialLang,
    };
  });

  // Stato Match a Round con scelta categoria alternata
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [chooserId, setChooserId] = useState<PlayerId>('p1');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [playedCategoryIds, setPlayedCategoryIds] = useState<string[]>([]);
  const [duelHistory, setDuelHistory] = useState<DuelSummary[]>([]);
  const [winnerId, setWinnerId] = useState<PlayerId>('p1');

  // Stato Discord P2P Host
  const [roomCode] = useState<string>(() => generateRoomCode());
  const [p2RemoteConnected, setP2RemoteConnected] = useState(false);
  const [latestRemotePacket, setLatestRemotePacket] =
    useState<RemoteMicPacket | null>(null);
  const [remoteTranscriptPreview, setRemoteTranscriptPreview] = useState('');
  const hostPeerRef = useRef<DiscordHostPeer | null>(null);

  useEffect(() => {
    soundEngine.enabled = settings.soundEnabled;
    soundEngine.announcerEnabled = settings.announcerEnabled;
    hapticsService.enabled = settings.hapticsEnabled;
  }, [settings.soundEnabled, settings.announcerEnabled, settings.hapticsEnabled]);

  useEffect(() => {
    if (remoteRoomParam) return;
    if (settings.micMode !== 'discord-p2p') {
      hostPeerRef.current?.destroy();
      hostPeerRef.current = null;
      setP2RemoteConnected(false);
      return;
    }

    const host = new DiscordHostPeer(
      roomCode,
      (packet) => {
        setLatestRemotePacket({ ...packet });
        if (packet.type === 'TRANSCRIPT' && packet.transcript) {
          setRemoteTranscriptPreview(packet.transcript);
        }
      },
      (connected) => {
        setP2RemoteConnected(connected);
      }
    );
    hostPeerRef.current = host;
    host.start();

    return () => {
      host.destroy();
    };
  }, [settings.micMode, roomCode, remoteRoomParam]);

  const handleSendRemoteState = useCallback((packet: RemoteMicPacket) => {
    hostPeerRef.current?.sendState(packet);
  }, []);

  if (remoteRoomParam) {
    return <RemoteMicScreen roomCode={remoteRoomParam} />;
  }

  const handleUpdatePlayer = (
    id: 'p1' | 'p2',
    name: string,
    avatar: string
  ) => {
    if (id === 'p1') {
      setP1((prev) => ({ ...prev, name, avatar }));
    } else {
      setP2((prev) => ({ ...prev, name, avatar }));
    }
  };

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.language && typeof window !== 'undefined') {
        localStorage.setItem('the_floor_lang', partial.language);
      }
      return updated;
    });
  };

  const handleStartNewGame = () => {
    const allCats = loadAllCategories();
    setCategories(allCats);
    setP1Score(0);
    setP2Score(0);
    setPlayedCategoryIds([]);
    setDuelHistory([]);
    setChooserId('p1');
    setScreen('draft');
  };

  const handleSelectCategory = async (cat: Category) => {
    const freshCat = await CategoryRepository.fetchCategoryById(cat.id);
    const chosen = freshCat || cat;
    const localized = localizeCategoryForGame(chosen, settings.language);
    setActiveCategory(localized);
    setPlayedCategoryIds((prev) => [...prev, cat.id]);
    setScreen('duel');
  };

  const handleDuelFinished = (summary: DuelSummary) => {
    const newP1Score = summary.winner === 'p1' ? p1Score + 1 : p1Score;
    const newP2Score = summary.winner === 'p2' ? p2Score + 1 : p2Score;

    setP1Score(newP1Score);
    setP2Score(newP2Score);
    setDuelHistory((prev) => [...prev, summary]);

    // Controlla se uno dei due giocatori ha raggiunto i punti vittoria
    if (
      settings.targetWins > 0 &&
      (newP1Score >= settings.targetWins || newP2Score >= settings.targetWins)
    ) {
      setWinnerId(newP1Score >= newP2Score ? 'p1' : 'p2');
      setScreen('victory');
      return;
    }

    // Passa rigorosamente a giro la scelta della prossima categoria all'altro giocatore!
    setChooserId((prev) => (prev === 'p1' ? 'p2' : 'p1'));
    setScreen('draft');
  };

  const handleFinishMatchEarly = () => {
    setWinnerId(p1Score >= p2Score ? 'p1' : 'p2');
    setScreen('victory');
  };

  const currentRound = duelHistory.length + 1;

  return (
    <>
      {screen === 'lobby' && (
        <LobbyScreen
          p1={p1}
          p2={p2}
          onUpdatePlayer={handleUpdatePlayer}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          categories={categories}
          roomCode={roomCode}
          p2RemoteConnected={p2RemoteConnected}
          remoteTranscriptPreview={remoteTranscriptPreview}
          onOpenCategoryEditor={() => setEditorOpen(true)}
          onStartGame={handleStartNewGame}
        />
      )}

      {screen === 'draft' && (
        <CategoryDraftScreen
          categories={categories}
          playedCategoryIds={playedCategoryIds}
          p1={p1}
          p2={p2}
          p1Score={p1Score}
          p2Score={p2Score}
          targetWins={settings.targetWins}
          chooserId={chooserId}
          roundNumber={currentRound}
          language={settings.language}
          lastSummary={
            duelHistory.length > 0
              ? duelHistory[duelHistory.length - 1]
              : null
          }
          onSelectCategory={handleSelectCategory}
          onFinishMatchEarly={handleFinishMatchEarly}
          onBackToLobby={() => setScreen('lobby')}
        />
      )}

      {screen === 'duel' && activeCategory && (
        <DuelArenaScreen
          roundNumber={currentRound}
          category={activeCategory}
          p1={p1}
          p2={p2}
          initialPlayer={chooserId}
          settings={settings}
          p2RemoteConnected={p2RemoteConnected}
          latestRemotePacket={latestRemotePacket}
          onSendRemoteState={handleSendRemoteState}
          onDuelFinished={handleDuelFinished}
        />
      )}

      {screen === 'victory' && (
        <VictoryScreen
          winnerId={winnerId}
          p1={p1}
          p2={p2}
          p1Score={p1Score}
          p2Score={p2Score}
          history={duelHistory}
          language={settings.language}
          onPlayAgain={handleStartNewGame}
          onBackToLobby={() => setScreen('lobby')}
        />
      )}

      {editorOpen && (
        <CategoryEditorModal
          allCategories={categories}
          language={settings.language}
          onClose={() => setEditorOpen(false)}
          onCategoriesUpdated={() => setCategories(loadAllCategories())}
        />
      )}
    </>
  );
};
