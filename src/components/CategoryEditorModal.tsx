import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  Sparkles,
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

  // Nuovo item in lavorazione
  const [itemAnswer, setItemAnswer] = useState('');
  const [itemAliases, setItemAliases] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemEmoji, setItemEmoji] = useState('🎯');

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
    if (!itemAnswer.trim()) return;
    const newItem: DuelItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      answer: itemAnswer.trim(),
      aliases: itemAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: itemImageUrl.trim(),
      fallbackEmoji: itemEmoji || '🎯',
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
      subtitle: subtitle.trim() || 'Categoria personalizzata YouTube',
      icon: icon || '⭐',
      themeHex: '#00f0ff',
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
    a.download = 'floor-arena-custom-pack.json';
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-5xl w-full max-h-[90vh] rounded-3xl bg-[#090e1f] border-2 border-indigo-500/40 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="font-display font-black text-2xl uppercase tracking-wider">
                STUDIO CATEGORIE & PACK PER YOUTUBE
              </h2>
              <p className="text-xs text-slate-400">
                Crea categorie personalizzate con le tue foto, meme o youtuber e definisci i sinonimi accettati
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonna Sinistra: Creatore Nuova Categoria */}
          <div className="lg:col-span-6 flex flex-col gap-4 bg-black/40 p-5 rounded-2xl border border-white/10">
            <h3 className="font-display font-bold text-lg text-cyan-300 uppercase">
              + Crea Nuova Categoria Custom
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  ICONA
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-center text-xl"
                />
              </div>
              <div className="col-span-3">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  NOME CATEGORIA
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. YouTuber Italiani, Meme, Calciatori..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-bold"
                />
              </div>
            </div>

            {/* Box Aggiunta singola immagine */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <span className="text-xs font-mono uppercase text-amber-300 font-bold">
                AGGIUNGI IMMAGINE ALLA CATEGORIA ({items.length} inserite, min. 3)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={itemAnswer}
                  onChange={(e) => setItemAnswer(e.target.value)}
                  placeholder="Risposta principale (es. CiccioGamer89)"
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs"
                />
                <input
                  type="text"
                  value={itemAliases}
                  onChange={(e) => setItemAliases(e.target.value)}
                  placeholder="Sinonimi separati da virgola (es. ciccio, mirko)"
                  className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="URL Immagine oppure carica dal PC ->"
                  className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs"
                />
                <label className="px-3 py-2 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-200 text-xs font-bold cursor-pointer flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={itemEmoji}
                  onChange={(e) => setItemEmoji(e.target.value)}
                  title="Emoji se non metti foto"
                  className="w-12 px-2 py-2 rounded-lg bg-black/50 border border-white/15 text-center text-sm"
                />
              </div>

              <button
                onClick={handleAddItem}
                disabled={!itemAnswer.trim()}
                className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Elemento alla Lista</span>
              </button>
            </div>

            {/* Lista elementi aggiunti */}
            {items.length > 0 && (
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <span className="truncate">
                      <strong>
                        {idx + 1}. {it.answer}
                      </strong>{' '}
                      {it.aliases.length > 0 && (
                        <span className="text-slate-400">
                          ({it.aliases.join(', ')})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setItems((prev) => prev.filter((x) => x.id !== it.id))
                      }
                      className="text-rose-400 hover:text-rose-300"
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 font-display font-bold text-sm uppercase tracking-wider disabled:opacity-40"
            >
              SALVA CATEGORIA NEL GIOCO ({items.length}/3 min)
            </button>
          </div>

          {/* Colonna Destra: Elenco Categorie Attive + Import/Export */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-white uppercase">
                  Categorie Pronte ({allCategories.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Esporta JSON</span>
                  </button>
                  <label className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importa JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                {allCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm truncate">
                          {cat.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {cat.items.length} immagini{' '}
                          {cat.isCustom && (
                            <span className="text-cyan-300">• CUSTOM</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {cat.isCustom && (
                      <button
                        onClick={() => handleDeleteCustomCategory(cat.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg"
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
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 font-display font-bold text-sm uppercase"
            >
              Torna alla Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
