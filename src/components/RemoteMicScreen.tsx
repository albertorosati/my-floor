import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, FastForward, Wifi, WifiOff } from 'lucide-react';
import { DiscordClientPeer } from '../engine/discordMicSync';
import { SmartSpeechRecognizer } from '../engine/speechRecognition';
import { PlayerId, RemoteMicPacket } from '../types/game';

interface RemoteMicScreenProps {
  roomCode: string;
}

export const RemoteMicScreen: React.FC<RemoteMicScreenProps> = ({
  roomCode,
}) => {
  const [connStatus, setConnStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [statusMsg, setStatusMsg] = useState('Connessione in corso...');
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);

  // Stato ricevuto dallo schermo principale
  const [activePlayer, setActivePlayer] = useState<PlayerId>('p1');
  const [p2Name, setP2Name] = useState('Giocatore 2');
  const [categoryName, setCategoryName] = useState('In attesa di sfida...');
  const [timeLeftP2, setTimeLeftP2] = useState<number | null>(null);

  const clientRef = useRef<DiscordClientPeer | null>(null);
  const recognizerRef = useRef<SmartSpeechRecognizer | null>(null);

  useEffect(() => {
    const client = new DiscordClientPeer(
      roomCode,
      (packet: RemoteMicPacket) => {
        if (packet.type === 'STATE_UPDATE') {
          if (packet.activePlayer) setActivePlayer(packet.activePlayer);
          if (packet.p2Name) setP2Name(packet.p2Name);
          if (packet.categoryName) setCategoryName(packet.categoryName);
          if (typeof packet.timeLeftP2 === 'number') {
            setTimeLeftP2(packet.timeLeftP2);
          }
        }
      },
      (status, msg) => {
        setConnStatus(status);
        if (msg) setStatusMsg(msg);
      }
    );
    clientRef.current = client;
    client.connect();

    return () => {
      recognizerRef.current?.stop();
      client.destroy();
    };
  }, [roomCode]);

  const toggleMicrophone = () => {
    if (micActive) {
      recognizerRef.current?.stop();
      setMicActive(false);
      setVolume(0);
      return;
    }

    setMicError(null);
    const rec = new SmartSpeechRecognizer(
      (alternatives, isFinal) => {
        setTranscript(alternatives[0] || '');
        clientRef.current?.sendPacket({
          type: 'TRANSCRIPT',
          transcript: alternatives[0],
          alternatives,
          isFinal,
        });
      },
      (listening, err) => {
        setMicActive(listening);
        if (err) setMicError(err);
      },
      (vol) => {
        setVolume(vol);
      }
    );
    recognizerRef.current = rec;
    rec.start();
  };

  const handleRemotePass = () => {
    clientRef.current?.sendPacket({ type: 'PASS_BUTTON' });
  };

  const isMyTurn = activePlayer === 'p2';

  return (
    <div className="min-h-screen studio-bg studio-grid-overlay flex flex-col items-center justify-between p-6 text-center select-none">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-400" />
          <span className="font-display font-bold text-lg tracking-wider">
            FLOOR ARENA // MIC REMOTO
          </span>
        </div>
        <span className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-400/40 font-mono text-xs text-rose-300 font-bold">
          STANZA {roomCode}
        </span>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md my-auto flex flex-col gap-5 bg-[#0c1124]/95 border-2 border-rose-500/50 neon-pink-box rounded-3xl p-6">
        {/* Stato Connessione P2P */}
        <div
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 ${
            connStatus === 'connected'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              : connStatus === 'connecting'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
          }`}
        >
          {connStatus === 'connected' ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{statusMsg}</span>
        </div>

        {/* Info Turno & Categoria */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-slate-400">
            GIOCATORE COLLEGATO: {p2Name}
          </span>
          <div className="font-display font-black text-xl text-white uppercase">
            {categoryName}
          </div>
          {timeLeftP2 !== null && (
            <div className="font-mono font-extrabold text-4xl text-rose-400 mt-1">
              {timeLeftP2.toFixed(1)}s
            </div>
          )}
          <div
            className={`mt-2 py-1.5 px-3 rounded-lg font-mono font-bold text-xs uppercase ${
              isMyTurn
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            {isMyTurn
              ? '🔥 TOCCA A TE! PARLA ORA!'
              : '⏳ Turno dell’avversario'}
          </div>
        </div>

        {/* Pulsante Attivazione Microfono */}
        <button
          onClick={toggleMicrophone}
          className={`w-full py-5 rounded-2xl font-display font-black text-xl uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all border-2 ${
            micActive
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-500 to-indigo-600 border-transparent text-white shadow-xl'
          }`}
        >
          <Mic className={`w-8 h-8 ${micActive ? 'animate-bounce' : ''}`} />
          <span>
            {micActive
              ? 'MICROFONO ATTIVO E IN ASCOLTO'
              : 'CLICCA PER ATTIVARE IL MICROFONO'}
          </span>
        </button>

        {/* Onda sonora e trascrizione live */}
        {micActive && (
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-emerald-400 transition-all duration-75"
                style={{ width: `${Math.max(6, volume * 100)}%` }}
              />
            </div>
            <p className="font-mono text-sm text-cyan-200 truncate">
              {transcript ? `“${transcript}”` : 'Parla normalmente...'}
            </p>
          </div>
        )}

        {micError && (
          <p className="text-xs text-rose-400 font-semibold">{micError}</p>
        )}

        {/* Pulsante Passo Remoto */}
        <button
          onClick={handleRemotePass}
          disabled={!micActive}
          className="w-full py-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-400/50 text-amber-300 font-display font-extrabold text-lg uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          <FastForward className="w-5 h-5" />
          <span>PASSO (-3 SECONDI)</span>
        </button>
      </main>

      <footer className="text-xs text-slate-500 font-mono">
        Guarda lo schermo condiviso su Discord mentre parli qui!
      </footer>
    </div>
  );
};
