import { DuelItem, VoiceMatchResult } from '../types/game';
import { voiceConfig } from '../services/configService';

const STOPWORDS = new Set([
  ...voiceConfig.stopwords,
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
  'it',
  'is',
  'and',
  'this',
  'that',
]);

const NUMBER_MAP: Record<string, string> = {
  ...voiceConfig.numberMap,
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
};

const PASS_KEYWORDS = new Set([
  ...voiceConfig.passKeywords,
  'pass',
  'skip',
  'next',
]);

export function normalizeText(raw: string): string {
  if (!raw) return '';
  let text = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`\-_.,!?;:()/\\"+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (voiceConfig.romanNumeralsMap) {
    for (const [roman, num] of Object.entries(voiceConfig.romanNumeralsMap)) {
      text = text.replace(new RegExp(`\\b${roman}\\b`, 'g'), num);
    }
  }

  const tokens = text
    .split(' ')
    .map((t) => NUMBER_MAP[t] ?? t)
    .filter((t) => t.length > 0 && t !== 'l' && !STOPWORDS.has(t));

  return tokens.join(' ');
}

export function phoneticSkeleton(normalized: string): string {
  if (!normalized) return '';
  let out = normalized;
  for (const [from, to] of voiceConfig.phoneticReplacements) {
    try {
      out = out.replace(new RegExp(from, 'g'), to);
    } catch {
      // Fallback per caratteri speciali
      out = out.split(from).join(to);
    }
  }
  return out.replace(/([a-z0-9])\1+/g, '$1');
}

export function italianStem(word: string): string {
  if (word.length < 4) return word;
  return word.replace(/[aeio]$/, '');
}

export function expandItemCandidates(item: DuelItem): string[] {
  const set = new Set<string>();
  const rawList = [
    item.answer,
    ...(item.aliases || []),
    ...(item.answerEn ? [item.answerEn] : []),
    ...(item.aliasesEn || []),
  ];

  for (const raw of rawList) {
    if (!raw) continue;
    set.add(raw);

    // Sottotitoli delimitati da ":", "-", "–"
    const subParts = raw
      .split(/[:\-–]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    for (const p of subParts) {
      set.add(p);
    }

    // Rimozione numeri o numeri romani in coda (es. "Titolo 3" -> "Titolo")
    const strippedTail = raw.replace(/\s+(?:[0-9]+|[ivxIVX]+)$/, '').trim();
    if (strippedTail && strippedTail !== raw && strippedTail.length >= 3) {
      set.add(strippedTail);
    }

    // Singole parole distintive con lunghezza >= 4 caratteri e non stopword
    const cleanWords = raw
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w.toLowerCase()));
    for (const w of cleanWords) {
      set.add(w);
    }
  }

  // Generazione automatica acronimi se la risposta principale è composta da 3+ parole significative
  const mainTokens = item.answer
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 1 && !STOPWORDS.has(w.toLowerCase()));
  if (mainTokens.length >= 3) {
    const acronym = mainTokens.map((w) => w[0].toLowerCase()).join('');
    if (acronym.length >= 3) {
      set.add(acronym);
    }
  }

  return Array.from(set);
}

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
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
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

function scoreCandidateMatch(spokenChunk: string, targetNorm: string): number {
  if (!spokenChunk || !targetNorm) return 0;

  if (spokenChunk === targetNorm) return 1.0;

  const spokenCompact = spokenChunk.replace(/\s+/g, '');
  const targetCompact = targetNorm.replace(/\s+/g, '');
  if (spokenCompact === targetCompact && targetCompact.length >= 3) {
    return 0.98;
  }

  if (targetCompact.length <= voiceConfig.thresholds.shortWordMaxLength) {
    return 0;
  }

  if (
    targetCompact.length >= 4 &&
    italianStem(spokenCompact) === italianStem(targetCompact)
  ) {
    return 0.95;
  }

  const spokenPhon = phoneticSkeleton(spokenCompact);
  const targetPhon = phoneticSkeleton(targetCompact);
  if (spokenPhon === targetPhon && targetPhon.length >= 4) {
    return 0.95;
  }
  if (
    targetPhon.length >= 5 &&
    italianStem(spokenPhon) === italianStem(targetPhon)
  ) {
    return 0.92;
  }

  const distCompact = damerauLevenshtein(spokenCompact, targetCompact);
  const distPhon = damerauLevenshtein(spokenPhon, targetPhon);
  const minLen = Math.min(spokenCompact.length, targetCompact.length);
  const maxLen = Math.max(spokenCompact.length, targetCompact.length);

  const relativeRatio = voiceConfig.thresholds.relativeLengthRatio ?? 0.35;
  const maxDiff = Math.max(
    voiceConfig.thresholds.maxLengthDifference,
    Math.floor(maxLen * relativeRatio)
  );

  if (Math.abs(spokenCompact.length - targetCompact.length) > maxDiff) {
    return 0;
  }

  if (
    targetCompact.length >= 4 &&
    targetCompact.length <= voiceConfig.thresholds.mediumWordMaxLength
  ) {
    if (distCompact <= 1 || (distPhon <= 1 && minLen >= 4)) {
      return 0.88;
    }
  } else if (targetCompact.length > voiceConfig.thresholds.mediumWordMaxLength) {
    if (distCompact <= 2 || distPhon <= 2) {
      const bestDist = Math.min(distCompact, distPhon);
      return 1 - bestDist / maxLen;
    }
  }

  return 0;
}

export function evaluateVoiceInput(
  transcripts: string[],
  item: DuelItem
): VoiceMatchResult {
  const rawCandidates = expandItemCandidates(item);
  const candidates = Array.from(
    new Set(
      rawCandidates.map((c) => normalizeText(c)).filter((c) => c.length > 0)
    )
  );

  let bestScore = 0;
  let bestAlias: string | undefined;
  let primaryNormalized = '';

  for (let idx = 0; idx < transcripts.length; idx++) {
    const raw = transcripts[idx];
    if (!raw) continue;

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

    const tailTokens = cleanTokens.slice(-2);
    if (tailTokens.some((tok) => PASS_KEYWORDS.has(tok))) {
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
    const spokenWords = normSpoken ? normSpoken.split(' ') : [];
    const rawCleanWords = cleanTokens;

    const windows = new Set<string>();
    if (normSpoken) windows.add(normSpoken);
    if (primaryNormalized) windows.add(primaryNormalized);

    // Finestre dai token normalizzati
    for (let wSize = 1; wSize <= Math.min(5, spokenWords.length); wSize++) {
      for (let start = 0; start <= spokenWords.length - wSize; start++) {
        windows.add(spokenWords.slice(start, start + wSize).join(' '));
      }
    }

    // Finestre dai token raw prima del drop delle stopwords (es. "il the ring")
    for (let wSize = 1; wSize <= Math.min(5, rawCleanWords.length); wSize++) {
      for (let start = 0; start <= rawCleanWords.length - wSize; start++) {
        windows.add(rawCleanWords.slice(start, start + wSize).join(' '));
      }
    }

    for (const candidate of candidates) {
      for (const win of windows) {
        const score = scoreCandidateMatch(win, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestAlias = candidate;
        }
        if (bestScore >= voiceConfig.thresholds.instantConfidence) {
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

  const accepted = bestScore >= voiceConfig.thresholds.acceptConfidence;
  return {
    matched: accepted,
    isPassCommand: false,
    matchedAlias: accepted ? bestAlias : undefined,
    confidenceScore: bestScore,
    normalizedHeard: primaryNormalized,
  };
}
