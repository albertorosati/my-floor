import { DiscordSDK, patchUrlMappings } from '@discord/embedded-app-sdk';

export const DEFAULT_DISCORD_CLIENT_ID = '1568251340294070313';

export const DISCORD_URL_MAPPINGS = [
  { prefix: '/upload-wikimedia', target: 'upload.wikimedia.org' },
  { prefix: '/thumb-wikimedia', target: 'thumb.wikimedia.org' },
  { prefix: '/wsrv', target: 'wsrv.nl' },
];

export interface DiscordActivityContext {
  isActivity: boolean;
  channelId?: string | null;
  instanceId?: string | null;
  guildId?: string | null;
  platform?: string | null;
}

/**
 * Checks whether the current window is running inside a Discord Activity iframe.
 */
export function isDiscordActivity(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const host = window.location.hostname.toLowerCase();

    // 1. Check Discord proxy host
    if (host.endsWith('.discordsays.com')) {
      return true;
    }

    // 2. Check query params passed by Discord
    if (params.has('frame_id')) {
      return true;
    }

    // 3. Running inside an iframe with an instance_id or channel_id
    if (window.parent && window.parent !== window && (params.has('instance_id') || params.has('channel_id'))) {
      return true;
    }
  } catch {
    // Cross-origin access error or URL parsing error
  }

  return false;
}

/**
 * Derives a collision-proof room code from a Discord instanceId or channelId.
 * If the input is already a UUID or long alphanumeric ID, it sanitizes and returns it directly.
 * Otherwise, it formats a deterministic, collision-resistant identifier.
 */
export function deriveRoomCodeFromDiscord(instanceOrChannelId: string): string {
  if (!instanceOrChannelId || !instanceOrChannelId.trim()) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'yapk-discord-session';
  }

  const cleaned = instanceOrChannelId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (cleaned.length >= 8 && cleaned.length <= 48) {
    return cleaned;
  }

  return `disc-${cleaned}`;
}

class DiscordActivityService {
  private discordSdk: DiscordSDK | null = null;
  private initialized = false;
  private isReady = false;

  public isActivity(): boolean {
    return isDiscordActivity();
  }

  public getContext(): DiscordActivityContext {
    if (typeof window === 'undefined') {
      return { isActivity: false };
    }

    const params = new URLSearchParams(window.location.search);
    return {
      isActivity: this.isActivity(),
      channelId: params.get('channel_id') || this.discordSdk?.channelId || null,
      instanceId: params.get('instance_id') || this.discordSdk?.instanceId || null,
      guildId: params.get('guild_id') || this.discordSdk?.guildId || null,
      platform: params.get('platform') || null,
    };
  }

  public getDerivedRoomCode(): string | null {
    const ctx = this.getContext();
    const id = ctx.instanceId || ctx.channelId;
    if (id) {
      return deriveRoomCodeFromDiscord(id);
    }
    return null;
  }

  public async init(clientId: string = DEFAULT_DISCORD_CLIENT_ID): Promise<boolean> {
    if (!this.isActivity() || this.initialized) {
      return this.isReady;
    }

    try {
      this.initialized = true;

      // 1. Intercept fetch & img[src] so Discord's proxy passes images through without CSP violations
      patchUrlMappings(DISCORD_URL_MAPPINGS, {
        patchFetch: true,
        patchWebSocket: false, // Leave WebRTC / PeerJS signaling intact
        patchXhr: true,
        patchSrcAttributes: true,
      });

      // 2. Initialize Discord SDK
      this.discordSdk = new DiscordSDK(clientId);

      // 3. Handshake ready with Discord client (removes loading splash)
      await this.discordSdk.ready();
      this.isReady = true;
      console.log('🎮 [Yappik] Discord Activity SDK handshake completed successfully!');
      return true;
    } catch (err) {
      console.warn('⚠️ [Yappik] Discord SDK handshake failed or running in test/sandbox environment:', err);
      return false;
    }
  }

  public getSdk(): DiscordSDK | null {
    return this.discordSdk;
  }
}

export const discordActivityService = new DiscordActivityService();
