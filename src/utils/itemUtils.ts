import { DuelItem } from '../types/game';
import { blacklistService } from '../services/blacklistService';

/**
 * Restituisce l'elenco completo e deduplicato delle URL fotografiche disponibili
 * per un dato soggetto, escludendo automaticamente tutte le immagini presenti nella blacklist
 * (sia statiche del catalogo che segnalate a runtime dall'utente).
 */
export function getItemImagePool(item: DuelItem): string[] {
  const pool = new Set<string>();

  if (item.imageUrl && typeof item.imageUrl === 'string') {
    const cleanPrimary = item.imageUrl.trim();
    if (cleanPrimary && !blacklistService.isBlacklisted(cleanPrimary)) {
      pool.add(cleanPrimary);
    }
  }

  if (Array.isArray(item.imageUrls)) {
    for (const url of item.imageUrls) {
      if (url && typeof url === 'string') {
        const clean = url.trim();
        if (clean && !blacklistService.isBlacklisted(clean)) {
          pool.add(clean);
        }
      }
    }
  }

  // Se tutte le foto sono in blacklist, restituisce array vuoto così
  // il chiamante sa che non ci sono più foto pulite disponibili.
  return Array.from(pool);
}

/**
 * Seleziona una fotografia casuale valida dal pool fotografico del soggetto.
 * Permette di cambiare scatto (angolazioni, contesti diversi)
 * ed evita foto già blacktlistate.
 */
export function getRandomItemImage(item: DuelItem): string {
  const pool = getItemImagePool(item);
  if (pool.length === 0) return item.imageUrl || '';
  if (pool.length === 1) return pool[0];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * Prepara il mazzo per l'arena del duello o l'allenamento:
 * 1. Esclude eventuali soggetti completamente blacktlistati.
 * 2. Per ciascun elemento assegna una fotografia valida non blacktlistata.
 * 3. Rimescola l'ordine degli elementi (Fisher-Yates).
 */
export function prepareArenaDeck(items: DuelItem[]): DuelItem[] {
  const validItems = items.filter((item) => {
    if (blacklistService.isItemBlacklisted(item.id)) return false;
    const pool = getItemImagePool(item);
    return pool.some((url) => !blacklistService.isBlacklisted(url));
  });

  const sourceItems = validItems.length >= 1 ? validItems : items;

  const copy: DuelItem[] = sourceItems.map((item) => {
    const chosenPhoto = getRandomItemImage(item);
    return {
      ...item,
      imageUrl: chosenPhoto,
    };
  });

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
