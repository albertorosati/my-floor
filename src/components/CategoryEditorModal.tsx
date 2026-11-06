import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Category, DuelItem, AppLanguage } from '../types/game';
import {
  getCustomCategoriesOnly,
  saveCustomCategories,
  getBackupImageUrl,
} from '../data/categories';
import { t } from '../services/i18n';

export const ENABLE_CUSTOM_CATEGORIES = false;

interface CategoryEditorModalProps {
  allCategories: Category[];
  language?: AppLanguage;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

export const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  allCategories,
  language = 'it',
  onClose,
  onCategoriesUpdated,
}) => {
  if (!ENABLE_CUSTOM_CATEGORIES) {
    return null;
  }
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [items, setItems] = useState<DuelItem[]>([]);

  const [itemAnswer, setItemAnswer] = useState('');
  const [itemAliases, setItemAliases] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemUploadedUrls, setItemUploadedUrls] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setItemUploadedUrls((prev) => [...prev, res]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddItem = () => {
    const textUrls = itemImageUrl
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:'));
    const allUrls = Array.from(new Set([...textUrls, ...itemUploadedUrls]));

    if (!itemAnswer.trim() || allUrls.length === 0) return;

    const newItem: DuelItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      answer: itemAnswer.trim(),
      aliases: itemAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: allUrls[0],
      imageUrls: allUrls.length > 1 ? allUrls : undefined,
    };
    setItems((prev) => [...prev, newItem]);
    setItemAnswer('');
    setItemAliases('');
    setItemImageUrl('');
    setItemUploadedUrls([]);
  };

  const handleSaveCategory = () => {
    if (!name.trim() || items.length < 3) return;
    const customList = getCustomCategoriesOnly();
    const newCat: Category = {
      id: `cat-custom-${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim() || 'Custom Category',
      icon: icon || '⭐',
      themeHex: '#FFC933',
      coverImage: items[0]?.imageUrl,
      items,
      isCustom: true,
      scope: 'intl',
    };
    saveCustomCategories([newCat, ...customList]);
    onCategoriesUpdated();
    setName('');
    setSubtitle('');
    setItems([]);
  };

  const handleDeleteCustomCategory = (id: string) => {
    const customList = getCustomCategoriesOnly().filter((c) => c.id !== id);
    saveCustomCategories(customList);
    onCategoriesUpdated();
  };

  const handleExportJson = () => {
    const customList = getCustomCategoriesOnly();
    const blob = new Blob([JSON.stringify(customList, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yappik-categories.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported: Category[] = JSON.parse(String(reader.result));
        if (Array.isArray(imported)) {
          const existing = getCustomCategoriesOnly();
          saveCustomCategories([...imported, ...existing]);
          onCategoriesUpdated();
        }
      } catch {
        alert(language === 'en' ? 'Invalid JSON file' : 'File JSON non valido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-paper max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-paper border-b-[3px] border-ink flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-ink">
              {language === 'en' ? `Category Deck (${allCategories.length})` : `Mazzo Categorie (${allCategories.length})`}
            </h2>
            <p className="text-xs text-ink/70 font-sans font-medium">
              {language === 'en'
                ? 'Browse included categories or create your own with custom photos.'
                : 'Sfoglia le categorie incluse o creane di tue con foto dal PC o link.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-push p-2 rounded-xl bg-paper border-[3px] border-ink text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create new category */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <h3 className="font-display font-black text-lg text-ink">
              {language === 'en' ? 'Create a category' : 'Crea una tua categoria'}
            </h3>

            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-1">
                <label className="text-xs font-bold text-ink/70 block mb-1">
                  {language === 'en' ? 'Icon' : 'Icona'}
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-white border-[3px] border-ink text-center text-xl"
                />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-bold text-ink/70 block mb-1">
                  {language === 'en' ? 'Category title' : 'Titolo categoria'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Friends, Memes...' : 'Es. Amici del gruppo, Meme...'}
                  className="w-full px-3 py-2 rounded-xl bg-white border-[3px] border-ink text-sm font-bold text-ink"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border-[3px] border-ink flex flex-col gap-2.5">
              <span className="text-xs font-bold text-ink">
                {t('editor.addSubject', language, { n: items.length })}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={itemAnswer}
                  onChange={(e) => setItemAnswer(e.target.value)}
                  placeholder={t('editor.answer', language)}
                  className="px-3 py-2 rounded-xl bg-paper border-[3px] border-ink text-xs text-ink font-bold"
                />
                <input
                  type="text"
                  value={itemAliases}
                  onChange={(e) => setItemAliases(e.target.value)}
                  placeholder={t('editor.aliases', language)}
                  className="px-3 py-2 rounded-xl bg-paper border-[3px] border-ink text-xs text-ink font-semibold"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder={t('editor.urls', language)}
                  className="flex-1 px-3 py-2 rounded-xl bg-paper border-[3px] border-ink text-xs text-ink font-semibold"
                />
                <label className="btn-push px-3 py-2 rounded-xl bg-yellow text-ink text-xs font-display font-black cursor-pointer flex items-center gap-1.5 border-[3px] border-ink shadow-hard-sm">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{t('editor.upload', language)}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {itemUploadedUrls.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-xs font-bold text-ink/70 whitespace-nowrap">
                    {itemUploadedUrls.length} {language === 'en' ? 'uploaded:' : 'caricate:'}
                  </span>
                  {itemUploadedUrls.map((url, i) => (
                    <div key={i} className="relative group shrink-0">
                      <img
                        src={url}
                        alt="Preview"
                        className="w-9 h-9 rounded-lg object-cover border-[3px] border-ink"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setItemUploadedUrls((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="absolute -top-1 -right-1 bg-red text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black border border-ink"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddItem}
                disabled={!itemAnswer.trim() || (!itemImageUrl.trim() && itemUploadedUrls.length === 0)}
                className="btn-push w-full py-2.5 rounded-xl bg-blue text-white font-display font-black text-xs flex items-center justify-center gap-1.5 border-[3px] border-ink shadow-hard-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{t('editor.addBtn', language)}</span>
              </button>
            </div>

            {items.length > 0 && (
              <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="px-3 py-1.5 rounded-xl bg-white border-[3px] border-ink flex items-center justify-between text-xs text-ink font-bold"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">
                        {idx + 1}. {it.answer}
                      </span>
                      <span className="text-[10px] bg-paper px-2 py-0.5 rounded-full border border-ink/30 shrink-0">
                        📸 {(it.imageUrls && it.imageUrls.length) || 1} {t('arena.photos', language)}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setItems((prev) => prev.filter((x) => x.id !== it.id))
                      }
                      className="text-red hover:opacity-75 shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveCategory}
              disabled={!name.trim() || items.length < 3}
              className="btn-push w-full py-3 rounded-xl bg-green text-ink font-display font-black text-sm border-[3px] border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
              {t('editor.saveBtn', language, { n: items.length })}
            </button>
          </div>

          {/* Active categories list */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-black text-lg text-ink">
                  {language === 'en' ? 'Active Categories' : 'Categorie attive'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="btn-push px-3 py-1.5 rounded-xl bg-paper border-[3px] border-ink text-xs font-bold text-ink flex items-center gap-1 shadow-hard-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('editor.exportBtn', language)}</span>
                  </button>
                  <label className="btn-push px-3 py-1.5 rounded-xl bg-paper border-[3px] border-ink text-xs font-bold text-ink flex items-center gap-1 cursor-pointer shadow-hard-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('editor.importBtn', language)}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                {allCategories.map((cat) => {
                  const cover = cat.coverImage || cat.items[0]?.imageUrl;
                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 rounded-xl bg-white border-[3px] border-ink flex items-center justify-between gap-2.5 shadow-hard-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-yellow border-[3px] border-ink shrink-0 flex items-center justify-center text-xl">
                          {cat.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="font-display font-bold text-xs sm:text-sm text-ink truncate">
                            {cat.name}
                          </div>
                          <div className="text-[10px] font-bold text-ink/60">
                            {cat.items.length} {language === 'en' ? 'photos' : 'foto'}{' '}
                            {cat.isCustom && (
                              <span className="text-blue font-bold">• {language === 'en' ? 'Custom' : 'Tua'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {cat.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomCategory(cat.id)}
                          aria-label="Delete"
                          className="p-1.5 text-red hover:opacity-75 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-push w-full py-3 rounded-xl bg-paper text-ink font-display font-bold text-sm border-[3px] border-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {t('editor.close', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
