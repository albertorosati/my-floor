/**
 * Servizio per il salvataggio e recupero dei record personali (High Scores)
 * per ciascuna categoria nella modalità Allenamento Solitario.
 */

const STORAGE_PREFIX = 'the_floor_solo_best_';

export const soloScoreService = {
  getSoloBest(categoryId: string): number {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    try {
      const val = localStorage.getItem(`${STORAGE_PREFIX}${categoryId}`);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  },

  saveSoloBest(
    categoryId: string,
    score: number
  ): { isNewBest: boolean; previousBest: number } {
    const previousBest = this.getSoloBest(categoryId);
    const isNewBest = score > previousBest;

    if (isNewBest && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${categoryId}`, String(score));
      } catch (err) {
        console.warn('Impossibile salvare il record personale su localStorage:', err);
      }
    }

    return { isNewBest, previousBest };
  },

  getAllSoloBests(): Record<string, number> {
    const results: Record<string, number> = {};
    if (typeof window === 'undefined' || !window.localStorage) return results;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const categoryId = key.substring(STORAGE_PREFIX.length);
          const score = parseInt(localStorage.getItem(key) || '0', 10);
          if (!isNaN(score)) {
            results[categoryId] = score;
          }
        }
      }
    } catch {
      // Ignore errors in sandboxed storage
    }

    return results;
  },

  resetSoloBests(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  },
};
