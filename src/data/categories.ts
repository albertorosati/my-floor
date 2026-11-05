import { Category } from '../types/game';
import generatedCatalog from './generatedCatalog.json';

export const DEFAULT_CATEGORIES: Category[] = generatedCatalog as Category[];

const CUSTOM_CATEGORIES_STORAGE_KEY = 'the_floor_custom_categories_v2';

export function loadAllCategories(): Category[] {
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

export function saveCustomCategories(customCategories: Category[]): void {
  try {
    localStorage.setItem(
      CUSTOM_CATEGORIES_STORAGE_KEY,
      JSON.stringify(customCategories)
    );
  } catch {
    // Ignora errori di quota localStorage
  }
}

export function getCustomCategoriesOnly(): Category[] {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (!saved) return [];
    const parsed: Category[] = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * URL proxy WebP di backup nel caso in cui un host esterno tardi o blocchi la richiesta.
 */
export function getBackupImageUrl(originalUrl: string): string {
  if (!originalUrl || originalUrl.startsWith('data:')) return originalUrl;
  return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=640&output=webp&q=80`;
}

/**
 * Precarica in anticipo nella cache del browser un blocco di fotografie della categoria scelta.
 */
export function preloadCategoryImages(category: Category, count = 16): void {
  if (typeof window === 'undefined') return;
  category.items.slice(0, count).forEach((item) => {
    if (item.imageUrl) {
      const img = new Image();
      img.decoding = 'async';
      img.src = item.imageUrl;
    }
  });
}
