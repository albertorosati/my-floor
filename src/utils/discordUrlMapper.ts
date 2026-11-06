import { isDiscordActivity } from '../services/discordActivityService';

/**
 * Rewrites an external image URL to route through Discord's application proxy mappings
 * when running inside an activity iframe on *.discordsays.com.
 *
 * When running in standard web mode, returns the original URL untouched.
 */
export function remapDiscordImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (!isDiscordActivity()) return url;

  // Don't modify already proxied, relative, or data URLs
  if (
    url.startsWith('/') ||
    url.startsWith('./') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'upload.wikimedia.org') {
      return `/.proxy/upload-wikimedia${parsed.pathname}${parsed.search}`;
    }

    if (parsed.hostname === 'thumb.wikimedia.org') {
      return `/.proxy/thumb-wikimedia${parsed.pathname}${parsed.search}`;
    }

    if (parsed.hostname === 'wsrv.nl') {
      return `/.proxy/wsrv${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // If URL parsing fails, return original
  }

  return url;
}
