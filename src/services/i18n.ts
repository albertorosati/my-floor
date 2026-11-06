import { AppLanguage, Category, CategoryScope, DuelItem } from '../types/game';

export interface Translations {
  [key: string]: {
    it: string;
    en: string;
  };
}

export const DICTIONARY: Translations = {
  // App & Header
  'app.title': { it: 'FLOOR ARENA', en: 'FLOOR ARENA' },
  'app.subtitle': {
    it: 'Il gioco vocale ispirato a The Floor',
    en: 'The voice duel game inspired by The Floor',
  },
  'app.install': { it: 'Installa App 📲', en: 'Install App 📲' },
  'app.installed': { it: 'App Installata ✨', en: 'App Installed ✨' },
  'app.language': { it: 'Lingua', en: 'Language' },

  // Game Modes
  'mode.solo': { it: '🎯 Allenamento (1P)', en: '🎯 Solo Practice (1P)' },
  'mode.duel': { it: '⚔️ Duello 1v1 (2P)', en: '⚔️ 1v1 Duel (2P)' },
  'mode.party': { it: '👑 Party (3-8P)', en: '👑 Party (3-8P)' },
  'mode.soloDesc': {
    it: 'Allenati da solo su qualsiasi categoria e batti i tuoi record!',
    en: 'Practice solo on any category and beat your high scores!',
  },
  'mode.duelDesc': {
    it: 'Sfida testa a testa a tempo alternato come in TV!',
    en: 'Head-to-head match with alternate clock like on TV!',
  },
  'mode.partyDesc': {
    it: 'Torneo party fino a 8 giocatori con classifica live!',
    en: 'Party tournament up to 8 players with live standings!',
  },

  // Solo Training
  'solo.title': { it: 'Allenamento Solitario', en: 'Solo Practice' },
  'solo.chooseCategory': { it: 'Scegli la Categoria di Allenamento', en: 'Choose Practice Category' },
  'solo.chooseCategorySub': {
    it: 'Seleziona una categoria e mettiti alla prova contro il tempo!',
    en: 'Pick a category and test yourself against the clock!',
  },
  'solo.duration': { it: 'Durata Allenamento', en: 'Practice Duration' },
  'solo.durationSec': { it: '{n} secondi', en: '{n} seconds' },
  'solo.durationFree': { it: 'Libera (senza limite)', en: 'Free (no timer)' },
  'solo.bestScore': { it: 'Miglior record: {n}', en: 'Personal best: {n}' },
  'solo.noBestYet': { it: 'Nessun record ancora', en: 'No record yet' },
  'solo.startTraining': { it: 'INIZIA ALLENAMENTO', en: 'START PRACTICE' },
  'solo.streak': { it: 'Serie', en: 'Streak' },
  'solo.correct': { it: 'Indovinati', en: 'Guessed' },
  'solo.passes': { it: 'Passi', en: 'Passes' },
  'solo.accuracy': { it: 'Precisione', en: 'Accuracy' },
  'solo.completed': { it: 'ALLENAMENTO COMPLETATO!', en: 'PRACTICE COMPLETED!' },
  'solo.newRecord': { it: '🎉 NUOVO RECORD PERSONALE!', en: '🎉 NEW PERSONAL BEST!' },
  'solo.previousBest': { it: 'Record precedente: {n}', en: 'Previous best: {n}' },
  'solo.playAgain': { it: 'Riprova Categoria', en: 'Try Again' },
  'solo.changeCategory': { it: 'Cambia Categoria', en: 'Change Category' },
  'solo.backHome': { it: 'Menu Principale', en: 'Main Menu' },
  'solo.finishEarly': { it: 'Termina Sessione', en: 'End Session' },
  'solo.manualCorrect': { it: 'Segna Corretta ✓', en: 'Mark Correct ✓' },

  // Party Mode
  'party.title': { it: 'Party Tournament', en: 'Party Tournament' },
  'party.players': { it: 'Giocatori nel Party ({n}/8)', en: 'Party Players ({n}/8)' },
  'party.addPlayer': { it: '+ Aggiungi Giocatore', en: '+ Add Player' },
  'party.removePlayer': { it: 'Rimuovi', en: 'Remove' },
  'party.playerNamePlaceholder': { it: 'Nome giocatore...', en: 'Player name...' },
  'party.turnOf': { it: 'Turno di {name}', en: "{name}'s Turn" },
  'party.selectOpponent': { it: 'Scegli chi sfidare nel prossimo duello:', en: 'Choose who to challenge next:' },
  'party.challenge': { it: 'Sfida', en: 'Challenge' },
  'party.leaderboard': { it: 'Classifica Torneo', en: 'Tournament Standings' },
  'party.wins': { it: 'Vittorie', en: 'Wins' },
  'party.duels': { it: 'Duelli', en: 'Duels' },
  'party.minPlayersWarning': {
    it: 'Aggiungi almeno 3 giocatori per la modalità Party!',
    en: 'Add at least 3 players for Party mode!',
  },
  'party.nextDuel': { it: 'PROSSIMO DUELLO', en: 'NEXT DUEL' },
  'party.champion': { it: '👑 CAMPIONE DEL TORNEO PARTY!', en: '👑 PARTY TOURNAMENT CHAMPION!' },

  // Lobby Screen
  'lobby.duelSettings': { it: 'Impostazioni Duello', en: 'Match Settings' },
  'lobby.timePerPlayer': { it: 'Tempo per giocatore', en: 'Time per player' },
  'lobby.pointsToWin': { it: 'Punti per la vittoria', en: 'Points to win' },
  'lobby.freePlay': { it: 'Partita libera (no limiti)', en: 'Free play (no limit)' },
  'lobby.pointsCount': { it: '{n} punti', en: '{n} points' },
  'lobby.micMode': { it: 'Modalità Microfono', en: 'Microphone Mode' },
  'lobby.micLocal': { it: 'Stesso dispositivo (Locale)', en: 'Same device (Local)' },
  'lobby.micLocalDesc': {
    it: 'I due giocatori parlano allo stesso smartphone o PC',
    en: 'Both players speak into the same phone or computer',
  },
  'lobby.micRemote': { it: '2 Dispositivi (P2P Remote Mic)', en: '2 Devices (Remote Mic)' },
  'lobby.micRemoteDesc': {
    it: 'Il Giocatore 2 si collega da telefono o Discord via WebRTC',
    en: 'Player 2 connects via phone or Discord using WebRTC',
  },
  'lobby.startDuel': { it: 'INIZIA IL DUELLO', en: 'START DUEL' },
  'lobby.customCategories': { it: 'Categorie Personalizzate', en: 'Custom Categories' },
  'lobby.p1Default': { it: 'Giocatore 1', en: 'Player 1' },
  'lobby.p2Default': { it: 'Giocatore 2', en: 'Player 2' },
  'lobby.testMic': { it: 'Prova microfono', en: 'Test microphone' },
  'lobby.testingMic': { it: 'In ascolto...', en: 'Listening...' },
  'lobby.micSaySomething': { it: 'Di’ qualcosa...', en: 'Say something...' },
  'lobby.micNotSupported': {
    it: 'Microfono non supportato in questo browser. Consigliato Google Chrome o Safari.',
    en: 'Microphone not supported in this browser. Please use Chrome or Safari.',
  },
  'lobby.totalCatalog': {
    it: '{categories} categorie • oltre {photos} fotografie HD',
    en: '{categories} categories • over {photos} HD photos',
  },

  // Category Draft Screen
  'draft.title': { it: 'Scegli la tua Categoria', en: 'Choose Your Category' },
  'draft.subtitle': {
    it: 'Tocca la categoria con cui vuoi sfidare il tuo avversario',
    en: 'Tap a category to challenge your opponent in the duel',
  },
  'draft.allCategories': { it: 'Tutte le Categorie', en: 'All Categories' },
  'draft.exploreAll': { it: 'Esplora tutte le categorie ({n})', en: 'Browse all categories ({n})' },
  'draft.searchPlaceholder': { it: 'Cerca categoria...', en: 'Search categories...' },
  'draft.select': { it: 'Scegli questa categoria →', en: 'Select this category →' },
  'draft.photosCount': { it: '{n} foto', en: '{n} photos' },
  'draft.subjectsCount': { it: '{n} soggetti', en: '{n} items' },
  'draft.alreadyPlayed': { it: 'Già giocata', en: 'Already played' },
  'draft.turnOf': { it: 'Turno di {name}', en: "{name}'s Turn" },
  'draft.filterAll': { it: 'Tutte', en: 'All' },
  'draft.filterIntl': { it: 'Internazionali 🌍', en: 'International 🌍' },
  'draft.filterItOnly': { it: 'Esclusive Italiane 🇮🇹', en: 'Italian Only 🇮🇹' },
  'draft.noCategoriesFound': { it: 'Nessuna categoria trovata', en: 'No categories found' },

  // Duel Arena Screen
  'arena.instruction': {
    it: 'Pronuncia la risposta esatta o premi PASSO',
    en: 'Say the correct answer or press PASS',
  },
  'arena.instructionMobile': {
    it: 'Parla al microfono o premi PASSO',
    en: 'Speak into the mic or press PASS',
  },
  'arena.passButton': { it: 'PASSO (-3s)', en: 'PASS (-3s)' },
  'arena.pause': { it: 'PAUSA', en: 'PAUSE' },
  'arena.resume': { it: 'RIPRENDI', en: 'RESUME' },
  'arena.sound': { it: 'Suoni', en: 'Sounds' },
  'arena.haptics': { it: 'Vibrazione', en: 'Haptics' },
  'arena.heard': { it: 'Hai detto:', en: 'Heard:' },
  'arena.roundWinner': { it: 'VINCITORE DEL ROUND!', en: 'ROUND WINNER!' },
  'arena.clutchGuess': { it: 'RISPOSTA AL VOLO!', en: 'CLUTCH GUESS!' },
  'arena.nextRound': { it: 'PROSSIMO ROUND', en: 'NEXT ROUND' },
  'arena.timeExpired': { it: 'TEMPO SCADUTO!', en: "TIME'S UP!" },
  'arena.exitDuel': { it: 'Esci dal duello', en: 'Quit duel' },
  'arena.exitConfirm': {
    it: 'Vuoi davvero abbandonare il duello in corso?',
    en: 'Do you really want to abandon the current duel?',
  },

  // Victory Screen
  'victory.champion': { it: 'CAMPIONE DELL\'ARENA!', en: 'ARENA CHAMPION!' },
  'victory.congrats': {
    it: 'Ha trionfato con {wins} vittorie!',
    en: 'Won the championship with {wins} victories!',
  },
  'victory.playAgain': { it: 'NUOVA PARTITA', en: 'PLAY AGAIN' },
  'victory.backLobby': { it: 'Torna alla Lobby', en: 'Back to Lobby' },

  // Category Editor Modal
  'editor.title': { it: 'Editor Categorie', en: 'Category Editor' },
  'editor.createTitle': { it: 'Crea una tua categoria', en: 'Create custom category' },
  'editor.icon': { it: 'Icona', en: 'Icon' },
  'editor.catTitle': { it: 'Titolo categoria', en: 'Category title' },
  'editor.addSubject': { it: 'Aggiungi foto ({n} inserite, min. 3)', en: 'Add photos ({n} added, min. 3)' },
  'editor.answer': { it: 'Risposta corretta', en: 'Correct answer' },
  'editor.aliases': { it: 'Sinonimi separati da virgola', en: 'Aliases (comma-separated)' },
  'editor.urls': {
    it: 'URL foto (uno o più separati da virgola)',
    en: 'Photo URLs (one or more comma-separated)',
  },
  'editor.upload': { it: 'Carica foto', en: 'Upload photos' },
  'editor.addBtn': { it: 'Aggiungi soggetto', en: 'Add item' },
  'editor.saveBtn': { it: 'Salva categoria ({n}/3 min)', en: 'Save category ({n}/3 min)' },
  'editor.export': { it: 'Esporta JSON', en: 'Export JSON' },
  'editor.import': { it: 'Importa JSON', en: 'Import JSON' },
  'editor.photosCount': { it: '{n} foto', en: '{n} photos' },
};

/**
 * Traduce una chiave del dizionario nella lingua specificata.
 */
export function t(
  key: string,
  lang: AppLanguage = 'it',
  params?: Record<string, string | number>
): string {
  const entry = DICTIONARY[key];
  let text = entry ? entry[lang] || entry.it : key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}

/**
 * Restituisce il titolo localizzato della categoria.
 */
export function getCategoryTitle(cat: Category, lang: AppLanguage = 'it'): string {
  if (lang === 'en' && cat.nameEn && cat.nameEn.trim()) {
    return cat.nameEn.trim();
  }
  return cat.name;
}

/**
 * Restituisce il sottotitolo localizzato della categoria.
 */
export function getCategorySubtitle(cat: Category, lang: AppLanguage = 'it'): string {
  if (lang === 'en' && cat.subtitleEn && cat.subtitleEn.trim()) {
    return cat.subtitleEn.trim();
  }
  return cat.subtitle;
}

/**
 * Restituisce la risposta target localizzata per il duello.
 */
export function getItemAnswer(item: DuelItem, lang: AppLanguage = 'it'): string {
  if (lang === 'en' && item.answerEn && item.answerEn.trim()) {
    return item.answerEn.trim();
  }
  return item.answer;
}

/**
 * Restituisce tutti i sinonimi / alias validi per il soggetto nella lingua attiva.
 */
export function getItemAliases(item: DuelItem, lang: AppLanguage = 'it'): string[] {
  const result = new Set<string>();

  if (lang === 'en') {
    if (item.answerEn?.trim()) result.add(item.answerEn.trim());
    if (Array.isArray(item.aliasesEn)) {
      item.aliasesEn.forEach((a) => a?.trim() && result.add(a.trim()));
    }
    // Aggiungi anche sinonimi e risposta base per tolleranza
    if (item.answer?.trim()) result.add(item.answer.trim());
    if (Array.isArray(item.aliases)) {
      item.aliases.forEach((a) => a?.trim() && result.add(a.trim()));
    }
  } else {
    if (item.answer?.trim()) result.add(item.answer.trim());
    if (Array.isArray(item.aliases)) {
      item.aliases.forEach((a) => a?.trim() && result.add(a.trim()));
    }
    // Aggiungi risposta inglese come variante secondaria valida
    if (item.answerEn?.trim()) result.add(item.answerEn.trim());
    if (Array.isArray(item.aliasesEn)) {
      item.aliasesEn.forEach((a) => a?.trim() && result.add(a.trim()));
    }
  }

  return Array.from(result);
}

/**
 * Clona e localizza una categoria per il duello nella lingua specificata.
 */
export function localizeCategoryForGame(cat: Category, lang: AppLanguage = 'it'): Category {
  if (lang === 'it') return cat;

  return {
    ...cat,
    name: getCategoryTitle(cat, lang),
    subtitle: getCategorySubtitle(cat, lang),
    items: cat.items.map((item) => ({
      ...item,
      answer: getItemAnswer(item, lang),
      aliases: getItemAliases(item, lang),
    })),
  };
}

/**
 * Filtra l'elenco delle categorie in base alla lingua e ai filtri tab:
 * - Se `lang === 'en'`: esclude tassativamente le categorie con `scope === 'it-only'`
 *   (es. Cantanti Italiani, TV Italiana, Attori Italiani, Cucina Tradizionale, Formaggi e Salumi).
 * - Se `lang === 'it'`: include tutte le categorie, permettendo filtraggio per tab.
 */
export function filterCategories(
  categories: Category[],
  lang: AppLanguage = 'it',
  tabFilter: 'all' | 'intl' | 'it-only' = 'all'
): Category[] {
  return categories.filter((cat) => {
    const isItOnly = cat.scope === 'it-only';

    // Regola cardine richiesta: in lingua inglese, le esclusive italiane sono escluse!
    if (lang === 'en' && isItOnly) {
      return false;
    }

    if (tabFilter === 'intl') {
      return !isItOnly;
    }

    if (tabFilter === 'it-only') {
      return isItOnly;
    }

    return true;
  });
}
