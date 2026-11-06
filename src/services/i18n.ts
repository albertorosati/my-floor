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
  'app.headerStats': {
    it: '{categories} categorie • {photos} foto HD',
    en: '{categories} categories • {photos} HD photos',
  },

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
  'solo.exitConfirmTitle': { it: 'Termina Sessione?', en: 'End Session?' },
  'solo.exitConfirmDesc': {
    it: 'Vuoi terminare adesso questa sessione di allenamento e salvare i tuoi risultati?',
    en: 'Do you want to end this practice session and save your results?',
  },
  'solo.continueBtn': { it: 'Continua', en: 'Keep Going' },
  'solo.endNowBtn': { it: 'Termina Ora', en: 'End Now' },
  'solo.loading': { it: 'Caricamento...', en: 'Loading...' },
  'solo.passPenaltyBadge': { it: 'PASSO -{n}s', en: 'PASS -{n}s' },

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
  'party.standingsDesc': {
    it: 'Vittorie accumulate e duelli disputati nel torneo',
    en: 'Total wins and duels played in the tournament',
  },

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
  'lobby.p1': { it: 'Giocatore 1', en: 'Player 1' },
  'lobby.p2': { it: 'Giocatore 2', en: 'Player 2' },
  'lobby.p1Placeholder': { it: 'Il tuo nome...', en: 'Your name...' },
  'lobby.p2Placeholder': { it: 'Nome sfidante...', en: 'Opponent name...' },
  'lobby.playerName': { it: 'Nome del giocatore:', en: 'Player name:' },
  'lobby.howToPlay': { it: 'Come giocate?', en: 'How do you play?' },
  'lobby.sameRoom': { it: 'Stessa stanza', en: 'Same room' },
  'lobby.sameRoomDesc': {
    it: 'Usate un solo microfono per entrambi parlando a turno davanti allo schermo.',
    en: 'Both players share one microphone, taking turns speaking in front of the screen.',
  },
  'lobby.onDiscord': { it: 'Su Discord', en: 'On Discord' },
  'lobby.onDiscordDesc': {
    it: 'Condividi lo schermo su Discord e manda un link rapido a {p2} per il suo microfono.',
    en: 'Share your screen on Discord and send a quick mic link to {p2}.',
  },
  'lobby.micLinkFor': { it: 'Link microfono per {p2}:', en: 'Microphone link for {p2}:' },
  'lobby.connected': { it: '✓ {p2} collegato!', en: '✓ {p2} connected!' },
  'lobby.waitingConnection': { it: 'In attesa che apra il link...', en: 'Waiting for connection...' },
  'lobby.copyLink': { it: 'Copia link', en: 'Copy link' },
  'lobby.copied': { it: 'Copiato!', en: 'Copied!' },
  'lobby.testVoicePrompt': {
    it: 'Vuoi fare una prova veloce del microfono?',
    en: 'Want to do a quick mic test?',
  },
  'lobby.testVoiceBtn': { it: 'Prova voce', en: 'Test mic' },
  'lobby.closeVoiceBtn': { it: 'Chiudi prova', en: 'Close test' },
  'lobby.testMic': { it: 'Prova microfono', en: 'Test microphone' },
  'lobby.testingMic': { it: 'In ascolto...', en: 'Listening...' },
  'lobby.micSaySomething': { it: 'Di’ qualcosa...', en: 'Say something...' },
  'lobby.micNotSupported': {
    it: 'Microfono non supportato in questo browser. Consigliato Google Chrome o Safari.',
    en: 'Microphone not supported in this browser. Please use Chrome or Safari.',
  },
  'lobby.micBrowserNotice': {
    it: 'Per giocare con la voce consenti l’accesso al microfono su Chrome, Safari, Edge o Brave (anche su mobile).',
    en: 'To play with voice, allow microphone access on Chrome, Safari, Edge or Brave (including mobile).',
  },
  'lobby.totalCatalog': {
    it: '{categories} categorie • oltre {photos} fotografie HD',
    en: '{categories} categories • over {photos} HD photos',
  },
  'lobby.partySub': {
    it: 'Configura da 3 a 8 partecipanti per il torneo. A ogni round, chi sfida sceglie l’avversario e la categoria!',
    en: 'Configure 3 to 8 players for the tournament. Each round, the challenger picks the opponent and category!',
  },
  'lobby.timeInDuels': { it: 'nei Duelli', en: 'in Duels' },
  'lobby.startParty': { it: 'INIZIA IL PARTY ARENA', en: 'START PARTY ARENA' },
  'lobby.footerSolo': {
    it: 'Modalità Allenamento: riconosci più soggetti possibili nel tempo stabilito e batti il tuo record!',
    en: 'Practice Mode: recognize as many items as possible within the time limit and beat your record!',
  },
  'lobby.footerDuel': {
    it: 'A turno si sceglie una categoria tra 4 carte proposte • Di’ “Passo” per cambiare foto con 3 secondi di penalità',
    en: 'Take turns choosing a category from 4 cards • Say “Pass” to skip a photo with a 3-second penalty',
  },
  'lobby.iosInstallTitle': { it: 'Installa su iPhone / iPad', en: 'Install on iPhone / iPad' },
  'lobby.iosInstallDesc': {
    it: 'Gioca a tutto schermo senza barre del browser in 2 semplici tocchi:',
    en: 'Play full-screen without browser bars in 2 easy steps:',
  },
  'lobby.iosStep1': {
    it: 'Tocca il tasto Condividi 📤 nella barra inferiore di Safari',
    en: 'Tap the Share button 📤 in Safari’s bottom bar',
  },
  'lobby.iosStep2': {
    it: 'Scorri in basso e scegli “Aggiungi alla schermata Home” ➕',
    en: 'Scroll down and choose “Add to Home Screen” ➕',
  },
  'lobby.iosUnderstood': { it: 'Ho capito!', en: 'Got it!' },

  // Category Draft Screen
  'draft.menu': { it: 'Menu', en: 'Menu' },
  'draft.firstTo': { it: 'A {n}', en: 'First to {n}' },
  'draft.finishEarly': { it: 'Concludi', en: 'End Match' },
  'draft.pointTo': {
    it: 'Punto a {winner} ({icon} {category}) con {time}s!',
    en: 'Point to {winner} ({icon} {category}) with {time}s left!',
  },
  'draft.categoryDraft': { it: 'Scelta categoria', en: 'Category Draft' },
  'draft.partyRound': { it: 'Round {round} • Party Arena', en: 'Round {round} • Party Arena' },
  'draft.title': { it: 'Scegli la tua Categoria', en: 'Choose Your Category' },
  'draft.subtitle': {
    it: 'Tocca la categoria con cui vuoi sfidare il tuo avversario',
    en: 'Tap a category to challenge your opponent in the duel',
  },
  'draft.allCategories': { it: 'Tutte le Categorie', en: 'All Categories' },
  'draft.exploreAll': { it: 'Esplora tutte le categorie ({n})', en: 'Browse all categories ({n})' },
  'draft.searchPlaceholder': { it: 'Cerca categoria...', en: 'Search categories...' },
  'draft.select': { it: 'Scegli questa categoria →', en: 'Select this category →' },
  'draft.selectCard': { it: 'Scegli questa →', en: 'Select this →' },
  'draft.startSoloCard': { it: 'Inizia Allenamento 🎯', en: 'Start Practice 🎯' },
  'draft.recordBadge': { it: 'Record: {n}', en: 'Record: {n}' },
  'draft.reroll': { it: 'Altre 4 proposte', en: 'Shuffle (Reroll)' },
  'draft.closeModal': { it: 'Chiudi', en: 'Close' },
  'draft.countdownReady': { it: 'VIA!', en: 'GO!' },
  'draft.chosenBy': { it: 'Scelta di {name}', en: 'Chosen by {name}' },
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
  'arena.keyboardHelp': {
    it: 'Spazio = Passo • Invio = Buona • P = Pausa',
    en: 'Space = Pass • Enter = Correct • P = Pause',
  },
  'arena.loadingPhoto': { it: 'Caricamento foto...', en: 'Loading photo...' },
  'arena.pointScoredAnnounce': {
    it: 'Ha vinto {name}! Punto conquistato!',
    en: '{name} won! Point scored!',
  },
  'arena.pointScoredTitle': { it: 'Punto Conquistato!', en: 'Round Won!' },
  'arena.hasWon': { it: 'Ha vinto {name}!', en: '{name} Won!' },
  'arena.pausedTitle': { it: 'Gioco in pausa', en: 'Game Paused' },
  'arena.pausedDesc': {
    it: 'Il tempo è fermo. Clicca qui sotto quando siete pronti a ripartire!',
    en: 'Timer is paused. Click below when you are ready to resume!',
  },
  'arena.chooseNextCategory': {
    it: 'Scegli la Prossima Categoria',
    en: 'Choose Next Category',
  },
  'arena.timeRanOutOn': {
    it: '{loser} ha esaurito il tempo su “{category}”',
    en: '{loser} ran out of time on “{category}”',
  },
  'arena.timeLeft': { it: 'Tempo Rimasto', en: 'Time Left' },
  'arena.correctPhotos': { it: 'Foto Indovinate', en: 'Correct Photos' },
  'arena.photos': { it: 'foto', en: 'photos' },

  // Victory Screen
  'victory.champion': { it: 'CAMPIONE DELL\'ARENA!', en: 'ARENA CHAMPION!' },
  'victory.congrats': {
    it: 'Ha trionfato con {wins} vittorie!',
    en: 'Won the championship with {wins} victories!',
  },
  'victory.playAgain': { it: 'NUOVA PARTITA', en: 'PLAY AGAIN' },
  'victory.backLobby': { it: 'Torna alla Lobby', en: 'Back to Lobby' },
  'victory.tieMatch': { it: 'Pareggio!', en: 'Tie Match!' },
  'victory.equalPoints': { it: 'Pari merito!', en: 'Equal Points!' },
  'victory.finalScore': { it: 'Punteggio finale:', en: 'Final Score:' },
  'victory.rounds': { it: 'Rounds', en: 'Rounds' },
  'victory.playerPhotos': { it: 'Foto {name}', en: '{name} Photos' },
  'victory.rematch': { it: 'Rivincita', en: 'Play Again' },
  'victory.backMenu': { it: 'Torna al Menu', en: 'Back to Menu' },

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
  'editor.exportBtn': { it: 'Esporta', en: 'Export' },
  'editor.importBtn': { it: 'Importa', en: 'Import' },
  'editor.close': { it: 'Chiudi', en: 'Close' },
  'editor.cancel': { it: 'Annulla', en: 'Cancel' },
  'editor.photosCount': { it: '{n} foto', en: '{n} photos' },
};

/**
 * Traduce i nomi predefiniti dei giocatori (es. "Giocatore 1" -> "Player 1", "Giocatore 2" -> "Player 2")
 * senza alterare i nomi personalizzati scelti dall'utente.
 */
export function localizePlayerName(name: string, lang: AppLanguage = 'it'): string {
  if (!name) return name;
  if (lang === 'en') {
    if (name.startsWith('Giocatore ')) {
      return name.replace('Giocatore ', 'Player ');
    }
  } else {
    if (name.startsWith('Player ')) {
      return name.replace('Player ', 'Giocatore ');
    }
  }
  return name;
}

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
