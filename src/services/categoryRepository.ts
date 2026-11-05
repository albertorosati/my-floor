import { Category } from '../types/game';
import { gameConfig } from './configService';
import generatedCatalog from '../data/generatedCatalog.json';

export const DEFAULT_CATEGORIES: Category[] = generatedCatalog as Category[];

const CUSTOM_CATEGORIES_STORAGE_KEY = 'the_floor_custom_categories_v2';

export class CategoryRepository {
  public static getAllCategories(): Category[] {
    try {
      const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
      if (!saved) return DEFAULT_CATEGORIES;
      const parsed: Category[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
      return [...parsed, ...DEFAULT_CATEGORIES];
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  /**
   * Carica i dati aggiornati della singola categoria dal suo file JSON modulare
   * (`./categories/<id>.json`), con fallback immediato al catalogo in memoria.
   */
  public static async fetchCategoryById(id: string): Promise<Category | null> {
    try {
      const res = await fetch(`./categories/${id}.json`);
      if (res.ok) {
        const data = (await res.json()) as Category;
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          return data;
        }
      }
    } catch {
      // Fallback al catalogo locale precaricato
    }
    return (
      this.getAllCategories().find((c) => c.id === id) || null
    );
  }

  public static saveCustomCategories(customCategories: Category[]): void {
    try {
      localStorage.setItem(
        CUSTOM_CATEGORIES_STORAGE_KEY,
        JSON.stringify(customCategories)
      );
    } catch {
      // Ignora errori di quota localStorage
    }
  }

  public static getCustomCategoriesOnly(): Category[] {
    try {
      const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
      if (!saved) return [];
      const parsed: Category[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public static getBackupImageUrl(originalUrl: string): string {
    if (!originalUrl || originalUrl.startsWith('data:')) return originalUrl;
    const cleanUrl = originalUrl.split('?')[0];
    return gameConfig.network.imageBackupProxyTemplate.replace(
      '{url}',
      encodeURIComponent(cleanUrl)
    );
  }

  public static preloadCategoryImages(
    category: Category,
    count = gameConfig.options.preloaderWindowSize * 2
  ): void {
    if (typeof window === 'undefined') return;
    category.items.slice(0, count).forEach((item) => {
      if (item.imageUrl) {
        const img = new Image();
        img.decoding = 'async';
        img.src = item.imageUrl;
      }
    });
  }
}
