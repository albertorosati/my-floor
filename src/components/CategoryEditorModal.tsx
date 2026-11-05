import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Category, DuelItem } from '../types/game';
import {
  getCustomCategoriesOnly,
  saveCustomCategories,
} from '../data/categories';

interface CategoryEditorModalProps {
  allCategories: Category[];
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

export const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  allCategories,
  onClose,
  onCategoriesUpdated,
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [items, setItems] = useState<DuelItem[]>([]);

  const [itemAnswer, setItemAnswer] = useState('');
  const [itemAliases, setItemAliases] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setItemImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = () => {
    if (!itemAnswer.trim() || !itemImageUrl.trim()) return;
    const newItem: DuelItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      answer: itemAnswer.trim(),
      aliases: itemAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: itemImageUrl.trim(),
    };
    setItems((prev) => [...prev, newItem]);
    setItemAnswer('');
    setItemAliases('');
    setItemImageUrl('');
  };

  const handleSaveCategory = () => {
    if (!name.trim() || items.length < 3) return;
    const customList = getCustomCategoriesOnly();
    const newCat: Category = {
      id: `cat-custom-${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim() || 'Categoria personalizzata',
      icon: icon || '⭐',
      themeHex: '#FFB800',
      coverImage: items[0]?.imageUrl,
      items,
      isCustom: true,
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
    a.download = 'the-floor-categorie-custom.json';
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
        alert('File JSON non valido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-cream max-w-5xl w-full max-h-[90vh] rounded-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-paper border-b-[3px] border-ink flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-ink">
              Mazzo Categorie ({allCategories.length})
            </h2>
            <p className="text-xs text-ink/70 font-medium">
              Sfoglia le categorie incluse o creane di tue con foto dal PC o link
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-push p-2 rounded-xl bg-white text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Crea nuova categoria */}
          <div className="lg:col-span-6 flex flex-col gap-4 bg-paper p-5 rounded-2xl border-2 border-ink">
            <h3 className="font-display font-bold text-lg text-ink">
              Crea una tua categoria
            </h3>

            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-1">
                <label className="text-[11px] font-bold text-ink/60 block mb-1">
                  Icona
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-white border-2 border-ink/25 text-center text-xl"
                />
              </div>
              <div className="col-span-3">
                <label className="text-[11px] font-bold text-ink/60 block mb-1">
                  Titolo categoria
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Amici del gruppo, Meme interni..."
                  className="w-full px-3 py-2 rounded-xl bg-white border-2 border-ink/25 text-sm font-bold text-ink"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border-2 border-ink/20 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-ink">
                Aggiungi foto ({items.length} inserite, min. 3)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={itemAnswer}
                  onChange={(e) => setItemAnswer(e.target.value)}
                  placeholder="Risposta corretta"
                  className="px-3 py-2 rounded-lg bg-paper border border-ink/25 text-xs text-ink font-semibold"
                />
                <input
                  type="text"
                  value={itemAliases}
                  onChange={(e) => setItemAliases(e.target.value)}
                  placeholder="Sinonimi separati da virgola"
                  className="px-3 py-2 rounded-lg bg-paper border border-ink/25 text-xs text-ink"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="Incolla URL foto oppure carica ->"
                  className="flex-1 px-3 py-2 rounded-lg bg-paper border border-ink/25 text-xs text-ink"
                />
                <label className="btn-push px-3 py-2 rounded-lg bg-gold text-ink text-xs font-display font-bold cursor-pointer flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Carica foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleAddItem}
                disabled={!itemAnswer.trim() || !itemImageUrl.trim()}
                className="btn-push w-full py-2 rounded-xl bg-p1 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi foto</span>
              </button>
            </div>

            {items.length > 0 && (
              <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="px-3 py-1.5 rounded-lg bg-white border border-ink/20 flex items-center justify-between text-xs text-ink"
                  >
                    <span className="truncate font-semibold">
                      {idx + 1}. {it.answer}
                    </span>
                    <button
                      onClick={() =>
                        setItems((prev) => prev.filter((x) => x.id !== it.id))
                      }
                      className="text-p2 hover:opacity-75"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveCategory}
              disabled={!name.trim() || items.length < 3}
              className="btn-push w-full py-3 rounded-xl bg-mint text-ink font-display font-bold text-sm"
            >
              Salva categoria ({items.length}/3 min)
            </button>
          </div>

          {/* Lista categorie */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-ink">
                  Categorie attive
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="px-2.5 py-1.5 rounded-lg bg-paper border border-ink/30 text-xs font-bold text-ink flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Esporta</span>
                  </button>
                  <label className="px-2.5 py-1.5 rounded-lg bg-paper border border-ink/30 text-xs font-bold text-ink flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importa</span>
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
                {allCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-paper border-2 border-ink/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm text-ink truncate">
                          {cat.name}
                        </div>
                        <div className="text-[11px] font-semibold text-ink/60">
                          {cat.items.length} foto{' '}
                          {cat.isCustom && (
                            <span className="text-p1 font-bold">• Tua</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {cat.isCustom && (
                      <button
                        onClick={() => handleDeleteCustomCategory(cat.id)}
                        className="p-1.5 text-p2 hover:bg-p2Light rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-push w-full py-3 rounded-xl bg-white text-ink font-display font-bold text-sm"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
