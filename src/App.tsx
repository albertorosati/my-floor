import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Category,
  DuelSummary,
  GameSettings,
  GridSizeOption,
  GridTile,
  PlayerConfig,
  PlayerId,
  RemoteMicPacket,
} from './types/game';
import { loadAllCategories } from './data/categories';
import { DiscordHostPeer, generateRoomCode } from './engine/discordMicSync';
import { soundEngine } from './engine/soundEffects';
import { LobbyScreen } from './components/LobbyScreen';
import { FloorGridScreen } from './components/FloorGridScreen';
import { DuelArenaScreen } from './components/DuelArenaScreen';
import { RemoteMicScreen } from './components/RemoteMicScreen';
import { CategoryEditorModal } from './components/CategoryEditorModal';
import { VictoryScreen } from './components/VictoryScreen';

type ScreenState = 'lobby' | 'grid' | 'duel' | 'victory';

function buildInitialGrid(
  size: GridSizeOption,
  categories: Category[]
): GridTile[] {
  const rows = 3;
  const cols = size === '3x3' ? 3 : 4;
  const totalRows = size === '4x4' ? 4 : rows;
  const totalTiles = totalRows * cols;

  const shuffledCats = [...categories].sort(() => Math.random() - 0.5);
  const tiles: GridTile[] = [];

  for (let i = 0; i < totalTiles; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cat = shuffledCats[i % shuffledCats.length];
    // Disposizione a scacchiera bilanciata per massimizzare i confini attaccabili fin dal turno 1
    const owner: PlayerId = (r + c) % 2 === 0 ? 'p1' : 'p2';
    tiles.push({
      index: i,
      row: r,
      col: c,
      owner,
      category: cat,
      battlesCount: 0,
    });
  }

  return tiles;
}

export const App: React.FC = () => {
  // Controlla se questo browser è stato aperto come Microfono Remoto per Giocatore 2 (?room=XXXX)
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
    name: 'Giocatore 1',
    avatar: '⚡',
    primaryHex: '#00f0ff',
    secondaryHex: '#0284c7',
    glowClass: 'neon-cyan-box',
    bgClass: 'bg-cyan-500',
    borderClass: 'border-cyan-400',
    textClass: 'text-cyan-300',
  });

  const [p2, setP2] = useState<PlayerConfig>({
    id: 'p2',
    name: 'Giocatore 2',
    avatar: '🔥',
    primaryHex: '#ff0055',
    secondaryHex: '#e11d48',
    glowClass: 'neon-pink-box',
    bgClass: 'bg-rose-500',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-300',
  });

  const [settings, setSettings] = useState<GameSettings>({
    gridSize: '3x4',
    duelDurationSeconds: 45,
    passPenaltySeconds: 3,
    micMode: 'local-shared',
    soundEnabled: true,
    announcerEnabled: true,
    autoRevealAnswerMs: 500,
  });

  // Stato Griglia e Duello
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [activeTurn, setActiveTurn] = useState<PlayerId>('p1');
  const [challengedTile, setChallengedTile] = useState<GridTile | null>(null);
  const [duelHistory, setDuelHistory] = useState<DuelSummary[]>([]);
  const [winnerId, setWinnerId] = useState<PlayerId | null>(null);

  // Stato Discord P2P Host
  const [roomCode] = useState<string>(() => generateRoomCode());
  const [p2RemoteConnected, setP2RemoteConnected] = useState(false);
  const [latestRemotePacket, setLatestRemotePacket] =
    useState<RemoteMicPacket | null>(null);
  const [remoteTranscriptPreview, setRemoteTranscriptPreview] = useState('');
  const hostPeerRef = useRef<DiscordHostPeer | null>(null);

  // Sincronizza flag audio
  useEffect(() => {
    soundEngine.enabled = settings.soundEnabled;
    soundEngine.announcerEnabled = settings.announcerEnabled;
  }, [settings.soundEnabled, settings.announcerEnabled]);

  // Avvia host P2P quando si seleziona la modalità Discord
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

  // Se siamo nel tab companion del Giocatore 2 su Discord, mostra l'interfaccia microfono dedicata
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
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleStartNewGame = () => {
    const allCats = loadAllCategories();
    setCategories(allCats);
    const initialTiles = buildInitialGrid(settings.gridSize, allCats);
    setTiles(initialTiles);
    setDuelHistory([]);
    setWinnerId(null);
    setActiveTurn(Math.random() < 0.5 ? 'p1' : 'p2');
    setScreen('grid');
  };

  const handleStartDuel = (tile: GridTile) => {
    setChallengedTile(tile);
    setScreen('duel');
  };

  const handleDuelFinished = (summary: DuelSummary) => {
    setDuelHistory((prev) => [...prev, summary]);

    if (!challengedTile) {
      setScreen('grid');
      return;
    }

    const updatedTiles = [...tiles];
    if (summary.winner === activeTurn) {
      // L'attaccante ha vinto: conquista la casella sfidata!
      updatedTiles[challengedTile.index] = {
        ...challengedTile,
        owner: summary.winner,
        battlesCount: challengedTile.battlesCount + 1,
      };
    } else {
      // Il difensore ha resistito e vinto: conquista una casella adiacente dell'attaccante!
      const attackerTiles = updatedTiles.filter((t) => t.owner === activeTurn);
      let tileToConquer = attackerTiles.find(
        (t) =>
          Math.abs(t.row - challengedTile.row) +
            Math.abs(t.col - challengedTile.col) ===
          1
      );
      if (!tileToConquer && attackerTiles.length > 0) {
        tileToConquer = attackerTiles[0];
      }
      if (tileToConquer) {
        updatedTiles[tileToConquer.index] = {
          ...tileToConquer,
          owner: summary.winner,
          battlesCount: tileToConquer.battlesCount + 1,
        };
      }
    }

    setTiles(updatedTiles);
    setActiveTurn(summary.winner);

    // Controlla se un giocatore possiede ora l'intero pavimento
    const allOwnedByWinner = updatedTiles.every(
      (t) => t.owner === summary.winner
    );
    if (allOwnedByWinner) {
      setWinnerId(summary.winner);
      setScreen('victory');
    } else {
      setScreen('grid');
    }
  };

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

      {screen === 'grid' && (
        <FloorGridScreen
          tiles={tiles}
          gridSize={settings.gridSize}
          p1={p1}
          p2={p2}
          activeTurn={activeTurn}
          lastSummary={
            duelHistory.length > 0
              ? duelHistory[duelHistory.length - 1]
              : null
          }
          onChangeTurn={setActiveTurn}
          onStartDuel={handleStartDuel}
          onBackToLobby={() => setScreen('lobby')}
        />
      )}

      {screen === 'duel' && challengedTile && (
        <DuelArenaScreen
          category={challengedTile.category}
          p1={p1}
          p2={p2}
          initialPlayer={activeTurn}
          settings={settings}
          p2RemoteConnected={p2RemoteConnected}
          latestRemotePacket={latestRemotePacket}
          onSendRemoteState={handleSendRemoteState}
          onDuelFinished={handleDuelFinished}
        />
      )}

      {screen === 'victory' && winnerId && (
        <VictoryScreen
          winnerId={winnerId}
          p1={p1}
          p2={p2}
          history={duelHistory}
          onPlayAgain={handleStartNewGame}
          onBackToLobby={() => setScreen('lobby')}
        />
      )}

      {editorOpen && (
        <CategoryEditorModal
          allCategories={categories}
          onClose={() => setEditorOpen(false)}
          onCategoriesUpdated={() => setCategories(loadAllCategories())}
        />
      )}
    </>
  );
};
