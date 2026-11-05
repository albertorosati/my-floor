import Peer, { DataConnection } from 'peerjs';
import { RemoteMicPacket } from '../types/game';

const PEER_PREFIX = 'floor-arena-v1-';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class DiscordHostPeer {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  public readonly roomCode: string;
  private onPacket: (packet: RemoteMicPacket) => void;
  private onConnectionChange: (connected: boolean, peerInfo?: string) => void;

  constructor(
    roomCode: string,
    onPacket: (packet: RemoteMicPacket) => void,
    onConnectionChange: (connected: boolean, peerInfo?: string) => void
  ) {
    this.roomCode = roomCode.toUpperCase();
    this.onPacket = onPacket;
    this.onConnectionChange = onConnectionChange;
  }

  public start(): void {
    this.destroy();
    const peerId = `${PEER_PREFIX}${this.roomCode}`;
    const peer = new Peer(peerId);
    this.peer = peer;

    peer.on('connection', (conn) => {
      if (this.connection) {
        try {
          this.connection.close();
        } catch {
          // Ignora
        }
      }
      this.connection = conn;

      conn.on('open', () => {
        this.onConnectionChange(true, 'Giocatore 2 Connesso');
      });

      conn.on('data', (data) => {
        if (data && typeof data === 'object' && 'type' in data) {
          this.onPacket(data as RemoteMicPacket);
        }
      });

      conn.on('close', () => {
        this.onConnectionChange(false);
      });

      conn.on('error', () => {
        this.onConnectionChange(false);
      });
    });

    peer.on('error', (err) => {
      console.warn('PeerJS Host warning:', err);
    });
  }

  public sendState(packet: RemoteMicPacket): void {
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(packet);
      } catch {
        // Ignora
      }
    }
  }

  public destroy(): void {
    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // Ignora
      }
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignora
      }
      this.peer = null;
    }
  }
}

export class DiscordClientPeer {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private roomCode: string;
  private onStatePacket: (packet: RemoteMicPacket) => void;
  private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected', msg?: string) => void;

  constructor(
    roomCode: string,
    onStatePacket: (packet: RemoteMicPacket) => void,
    onStatusChange: (status: 'connecting' | 'connected' | 'disconnected', msg?: string) => void
  ) {
    this.roomCode = roomCode.toUpperCase().trim();
    this.onStatePacket = onStatePacket;
    this.onStatusChange = onStatusChange;
  }

  public connect(): void {
    this.destroy();
    this.onStatusChange('connecting', `Connessione alla stanza ${this.roomCode}...`);

    const peer = new Peer();
    this.peer = peer;

    peer.on('open', () => {
      const targetId = `${PEER_PREFIX}${this.roomCode}`;
      const conn = peer.connect(targetId, { reliable: true });
      this.connection = conn;

      conn.on('open', () => {
        this.onStatusChange('connected', 'Connesso allo schermo principale!');
      });

      conn.on('data', (data) => {
        if (data && typeof data === 'object' && 'type' in data) {
          this.onStatePacket(data as RemoteMicPacket);
        }
      });

      conn.on('close', () => {
        this.onStatusChange('disconnected', 'Connessione chiusa dall\'host.');
      });

      conn.on('error', () => {
        this.onStatusChange('disconnected', 'Errore di comunicazione P2P.');
      });
    });

    peer.on('error', (err) => {
      this.onStatusChange(
        'disconnected',
        `Stanza ${this.roomCode} non trovata o non ancora attiva (${err.type}).`
      );
    });
  }

  public sendPacket(packet: RemoteMicPacket): void {
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(packet);
      } catch {
        // Ignora
      }
    }
  }

  public destroy(): void {
    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // Ignora
      }
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignora
      }
      this.peer = null;
    }
  }
}
