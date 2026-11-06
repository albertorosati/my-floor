import { Category } from '../types/game';
import { gameConfig } from './configService';
import generatedCatalog from '../data/generatedCatalog.json';
import { remapDiscordImageUrl } from '../utils/discordUrlMapper';

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
    const rawBackup = gameConfig.network.imageBackupProxyTemplate.replace(
      '{url}',
      encodeURIComponent(cleanUrl)
    );
    return remapDiscordImageUrl(rawBackup);
  }

  private static decodedCache = new Map<string, HTMLImageElement>();

  public static isImageCached(url: string): boolean {
    if (!url) return false;
    return this.decodedCache.has(url);
  }

  public static primeImage(url: string): Promise<void> {
    if (!url || typeof window === 'undefined') return Promise.resolve();
    if (this.decodedCache.has(url)) return Promise.resolve();

    return new Promise((resolve) => {
      const cleanUrl = url.split('?')[0];
      const targetUrl = remapDiscordImageUrl(cleanUrl);
      const img = new Image();
      img.decoding = 'async';

      const finish = () => {
        CategoryRepository.decodedCache.set(url, img);
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      };

      img.onload = finish;
      img.onerror = () => {
        // Tenta subito con il proxy WebP
        const backup = CategoryRepository.getBackupImageUrl(cleanUrl);
        if (backup && backup !== targetUrl) {
          const img2 = new Image();
          img2.decoding = 'async';
          img2.onload = () => {
            CategoryRepository.decodedCache.set(url, img2);
            if ('decode' in img2 && typeof img2.decode === 'function') {
              img2.decode().then(() => resolve()).catch(() => resolve());
            } else {
              resolve();
            }
          };
          img2.onerror = () => resolve();
          img2.src = remapDiscordImageUrl(backup);
        } else {
          resolve();
        }
      };
      img.src = targetUrl;
    });
  }

  public static preloadCategoryImages(
    category: Category,
    count = gameConfig.options.preloaderWindowSize * 2
  ): void {
    if (typeof window === 'undefined') return;
    const targets = category.items.slice(0, count);
    targets.forEach((item) => {
      // Precarica sia l'immagine primaria che le foto alternative del pool
      if (item.imageUrl) {
        CategoryRepository.primeImage(item.imageUrl).catch(() => {});
      }
      if (Array.isArray(item.imageUrls)) {
        item.imageUrls.forEach((altUrl) => {
          if (altUrl) {
            CategoryRepository.primeImage(altUrl).catch(() => {});
          }
        });
      }
    });
  }
}
