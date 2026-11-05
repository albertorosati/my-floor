import { DuelItem, VoiceMatchResult } from '../types/game';

const ITALIAN_STOPWORDS = new Set([
  'il',
  'lo',
  'la',
  'i',
  'gli',
  'le',
  'un',
  'uno',
  'una',
  'di',
  'del',
  'dello',
  'della',
  'dei',
  'degli',
  'delle',
  'a',
  'al',
  'allo',
  'alla',
  'ai',
  'agli',
  'alle',
  'da',
  'dal',
  'dallo',
  'dalla',
  'in',
  'nel',
  'nello',
  'nella',
  'con',
  'su',
  'sul',
  'sullo',
  'sulla',
  'per',
  'e',
  'ed',
  'o',
  'questo',
  'questa',
  'quello',
  'quella',
  'sono',
  'ecco',
]);

const NUMBER_MAP: Record<string, string> = {
  '0': 'zero',
  '1': 'uno',
  '2': 'due',
  '3': 'tre',
  '4': 'quattro',
  '5': 'cinque',
  '6': 'sei',
  '7': 'sette',
  '8': 'otto',
  '9': 'nove',
  '10': 'dieci',
};

const PASS_KEYWORDS = new Set([
  'passo',
  'passa',
  'salta',
  'skip',
  'passiamo',
  'avanti',
]);

/**
 * Normalizza una stringa rimuovendo accenti, punteggiatura, apostrofi e uniformando i numeri.
 */
export function normalizeText(raw: string): string {
  if (!raw) return '';
  let text = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove diacritici/accenti
    .replace(/['’`\-_.,!?;:()/\\"+]/g, ' ') // Sostituisce punteggiatura e apostrofi con spazi
    .replace(/\s+/g, ' ')
    .trim();

  // Rimuove prefissi con apostrofo attaccati comuni (es. "l elefante" -> "elefante", "un orso" -> "orso")
  const tokens = text
    .split(' ')
    .map((t) => NUMBER_MAP[t] ?? t)
    .filter((t) => t.length > 0 && t !== 'l' && !ITALIAN_STOPWORDS.has(t));

  return tokens.join(' ');
}

/**
 * Crea uno "scheletro fonetico" italo-inglese per gestire doppie mancate, k/c, ph/f, y/i, w/v, ecc.
 */
export function phoneticSkeleton(normalized: string): string {
  if (!normalized) return '';
  return normalized
    .replace(/ph/g, 'f')
    .replace(/sh/g, 'sc')
    .replace(/th/g, 't')
    .replace(/ck/g, 'c')
    .replace(/k/g, 'c')
    .replace(/y/g, 'i')
    .replace(/w/g, 'v')
    .replace(/x/g, 'cs')
    .replace(/([a-z])\1+/g, '$1'); // Collassa le doppie (es. "ippopotamo" -> "ipopotamo")
}

/**
 * Estrae la radice singolare/plurale italiana per parole di almeno 4 lettere
 * (es. "forbici" -> "forbic", "forbice" -> "forbic", "canguri" -> "cangur", "canguro" -> "cangur").
 */
export function italianStem(word: string): string {
  if (word.length < 4) return word;
  return word.replace(/[aeio]$/, '');
}

/**
 * Distanza di Damerau-Levenshtein (include trasposizioni di 2 lettere adiacenti).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Cancellazione
        dp[i][j - 1] + 1, // Inserimento
        dp[i - 1][j - 1] + cost // Sostituzione
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[lenA][lenB];
}

/**
 * Confronta una finestra di parole pronunciate (`spokenChunk`) con un singolo candidato (`targetNorm`).
 * Restituisce un punteggio di confidenza da 0 a 1 (match valido se >= 0.78).
 */
function scoreCandidateMatch(spokenChunk: string, targetNorm: string): number {
  if (!spokenChunk || !targetNorm) return 0;

  // 1. Match esatto normalizzato
  if (spokenChunk === targetNorm) return 1.0;

  // Match senza spazi (es. "spider man" === "spiderman", " youtube " === "you tube")
  const spokenCompact = spokenChunk.replace(/\s+/g, '');
  const targetCompact = targetNorm.replace(/\s+/g, '');
  if (spokenCompact === targetCompact && targetCompact.length >= 3) {
    return 0.98;
  }

  // 2. Per parole molto corte (<= 3 caratteri, es. "re", "sci", "uva", "blu"),
  // accettiamo SOLO match esatto di parola intera per evitare falsi positivi!
  if (targetCompact.length <= 3) {
    return 0;
  }

  // 3. Match di radice singolare/plurale (es. "forbice" vs "forbici", "canguri" vs "canguro")
  if (
    targetCompact.length >= 4 &&
    italianStem(spokenCompact) === italianStem(targetCompact)
  ) {
    return 0.95;
  }

  // 4. Match sullo scheletro fonetico (es. "ipopotamo" vs "ippopotamo", " telefonino " vs "ttelevonino")
  const spokenPhon = phoneticSkeleton(spokenCompact);
  const targetPhon = phoneticSkeleton(targetCompact);
  if (spokenPhon === targetPhon && targetPhon.length >= 4) {
    return 0.93;
  }
  if (
    targetPhon.length >= 5 &&
    italianStem(spokenPhon) === italianStem(targetPhon)
  ) {
    return 0.9;
  }

  // 5. Fuzzy Damerau-Levenshtein calibrato sulla lunghezza
  const distCompact = damerauLevenshtein(spokenCompact, targetCompact);
  const distPhon = damerauLevenshtein(spokenPhon, targetPhon);
  const minLen = Math.min(spokenCompact.length, targetCompact.length);
  const maxLen = Math.max(spokenCompact.length, targetCompact.length);

  // Evitiamo match se la differenza di lunghezza è eccessiva
  if (Math.abs(spokenCompact.length - targetCompact.length) > 2) {
    return 0;
  }

  if (targetCompact.length >= 5 && targetCompact.length <= 7) {
    // Su parole di 5-7 lettere accettiamo al massimo 1 errore di battitura/pronuncia
    if (distCompact <= 1 || (distPhon <= 1 && minLen >= 5)) {
      return 0.85;
    }
  } else if (targetCompact.length >= 8) {
    // Su parole lunghe (>= 8 lettere) accettiamo fino a 2 piccole imprecisioni
    if (distCompact <= 2 || distPhon <= 1) {
      return 1 - distCompact / maxLen;
    }
  }

  return 0;
}

/**
 * Valuta una lista di alternative vocali (`transcripts`, provenienti da `interimResults` e `maxAlternatives`)
 * rispetto all'elemento corrente del duello (`item`).
 */
export function evaluateVoiceInput(
  transcripts: string[],
  item: DuelItem
): VoiceMatchResult {
  const candidates = [item.answer, ...(item.aliases || [])]
    .map((c) => normalizeText(c))
    .filter((c) => c.length > 0);

  let bestScore = 0;
  let bestAlias: string | undefined;
  let primaryNormalized = '';

  for (let idx = 0; idx < transcripts.length; idx++) {
    const raw = transcripts[idx];
    if (!raw) continue;

    // Controlliamo prima se l'utente ha detto chiaramente "PASSO" / "SALTA"
    // come ultima parola o frase dedicata
    const cleanTokens = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (idx === 0) {
      primaryNormalized = cleanTokens.join(' ');
    }

    // Se una delle ultime 2 parole pronunciate è esattamente "passo" / "salta" / "skip"
    const tailTokens = cleanTokens.slice(-2);
    if (tailTokens.some((tok) => PASS_KEYWORDS.has(tok))) {
      // Verifica che la risposta stessa non contenga "passo"
      const targetHasPass = candidates.some((c) => c.includes('pass'));
      if (!targetHasPass) {
        return {
          matched: false,
          isPassCommand: true,
          confidenceScore: 1,
          normalizedHeard: primaryNormalized || raw,
        };
      }
    }

    const normSpoken = normalizeText(raw);
    if (!normSpoken) continue;

    const spokenWords = normSpoken.split(' ');

    // Costruiamo tutte le sotto-finestre di 1, 2, 3, 4 parole (n-grams)
    // in modo che se uno dice "ah sì quello è un canguro gigante", la finestra "canguro" faccia match subito!
    const windows = new Set<string>();
    windows.add(normSpoken);
    for (let wSize = 1; wSize <= Math.min(4, spokenWords.length); wSize++) {
      for (let start = 0; start <= spokenWords.length - wSize; start++) {
        windows.add(spokenWords.slice(start, start + wSize).join(' '));
      }
    }

    for (const candidate of candidates) {
      for (const win of windows) {
        const score = scoreCandidateMatch(win, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestAlias = candidate;
        }
        if (bestScore >= 0.95) {
          return {
            matched: true,
            isPassCommand: false,
            matchedAlias: bestAlias,
            confidenceScore: bestScore,
            normalizedHeard: primaryNormalized || normSpoken,
          };
        }
      }
    }
  }

  return {
    matched: bestScore >= 0.82,
    isPassCommand: false,
    matchedAlias: bestScore >= 0.82 ? bestAlias : undefined,
    confidenceScore: bestScore,
    normalizedHeard: primaryNormalized,
  };
}
