import { Category } from '../types/game';
import {
  CategoryRepository,
  DEFAULT_CATEGORIES,
} from '../services/categoryRepository';

export { DEFAULT_CATEGORIES };

export function loadAllCategories(): Category[] {
  return CategoryRepository.getAllCategories();
}

export function saveCustomCategories(customCategories: Category[]): void {
  CategoryRepository.saveCustomCategories(customCategories);
}

export function getCustomCategoriesOnly(): Category[] {
  return CategoryRepository.getCustomCategoriesOnly();
}

export function getBackupImageUrl(originalUrl: string): string {
  return CategoryRepository.getBackupImageUrl(originalUrl);
}

export function preloadCategoryImages(category: Category, count = 20): void {
  CategoryRepository.preloadCategoryImages(category, count);
}
