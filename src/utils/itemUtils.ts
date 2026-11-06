import { DuelItem } from '../types/game';

/**
 * Restituisce l'elenco completo e deduplicato delle URL fotografiche disponibili
 * per un dato soggetto (immagine primaria + eventuali scatti alternativi).
 */
export function getItemImagePool(item: DuelItem): string[] {
  const pool = new Set<string>();

  if (item.imageUrl && typeof item.imageUrl === 'string') {
    const cleanPrimary = item.imageUrl.trim();
    if (cleanPrimary) pool.add(cleanPrimary);
  }

  if (Array.isArray(item.imageUrls)) {
    for (const url of item.imageUrls) {
      if (url && typeof url === 'string') {
        const clean = url.trim();
        if (clean) pool.add(clean);
      }
    }
  }

  return pool.size > 0 ? Array.from(pool) : [item.imageUrl || ''];
}

/**
 * Seleziona una fotografia casuale dal pool fotografico del soggetto.
 * Permette di cambiare scatto (angolazioni, espressioni, età, contesti diversi)
 * per evitare che il giocatore memorizzi la singola foto invece di riconoscere la persona.
 */
export function getRandomItemImage(item: DuelItem): string {
  const pool = getItemImagePool(item);
  if (pool.length <= 1) return pool[0] || item.imageUrl;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * Prepara il mazzo per l'arena del duello:
 * 1. Per ciascun elemento assegna una fotografia scelta a caso tra quelle disponibili.
 * 2. Rimescola l'ordine degli elementi (Fisher-Yates).
 */
export function prepareArenaDeck(items: DuelItem[]): DuelItem[] {
  const copy: DuelItem[] = items.map((item) => {
    const pool = getItemImagePool(item);
    if (pool.length <= 1) {
      return { ...item };
    }
    const chosenPhoto = pool[Math.floor(Math.random() * pool.length)];
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
