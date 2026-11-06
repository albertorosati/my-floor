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
  const text = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`\-_.,!?;:()/\\"+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
    out = out.replace(new RegExp(from, 'g'), to);
  }
  return out.replace(/([a-z])\1+/g, '$1');
}

export function italianStem(word: string): string {
  if (word.length < 4) return word;
  return word.replace(/[aeio]$/, '');
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
    return 0.93;
  }
  if (
    targetPhon.length >= 5 &&
    italianStem(spokenPhon) === italianStem(targetPhon)
  ) {
    return 0.9;
  }

  const distCompact = damerauLevenshtein(spokenCompact, targetCompact);
  const distPhon = damerauLevenshtein(spokenPhon, targetPhon);
  const minLen = Math.min(spokenCompact.length, targetCompact.length);
  const maxLen = Math.max(spokenCompact.length, targetCompact.length);

  if (
    Math.abs(spokenCompact.length - targetCompact.length) >
    voiceConfig.thresholds.maxLengthDifference
  ) {
    return 0;
  }

  if (
    targetCompact.length >= 5 &&
    targetCompact.length <= voiceConfig.thresholds.mediumWordMaxLength
  ) {
    if (distCompact <= 1 || (distPhon <= 1 && minLen >= 5)) {
      return 0.85;
    }
  } else if (targetCompact.length > voiceConfig.thresholds.mediumWordMaxLength) {
    if (distCompact <= 2 || distPhon <= 1) {
      return 1 - distCompact / maxLen;
    }
  }

  return 0;
}

export function evaluateVoiceInput(
  transcripts: string[],
  item: DuelItem
): VoiceMatchResult {
  const allRaw = [
    item.answer,
    ...(item.aliases || []),
    ...(item.answerEn ? [item.answerEn] : []),
    ...(item.aliasesEn || []),
  ];
  const candidates = Array.from(
    new Set(allRaw.map((c) => normalizeText(c)).filter((c) => c.length > 0))
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
    if (!normSpoken) continue;

    const spokenWords = normSpoken.split(' ');
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
