import { describe, it, expect } from 'vitest';
import { evaluateVoiceInput, normalizeText, phoneticSkeleton } from './voiceMatcher';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { APP_VERSION } from '../config/version';
import { DuelItem } from '../types/game';

describe('voiceMatcher Engine & Real-Photo Catalog', () => {
  const sampleItem: DuelItem = {
    id: 'test-1',
    answer: 'Ippopotamo',
    aliases: ['ipopotamo', 'ippopotami'],
    imageUrl: 'https://upload.wikimedia.org/sample.jpg',
  };

  it('normalizza articoli, apostrofi, accenti e numeri', () => {
    expect(normalizeText("L'Elefante è grande")).toBe('elefante grande');
    expect(normalizeText('Un caffè! Sette')).toBe('caffe sette');
    expect(normalizeText('PlayStation 5')).toBe('playstation cinque');
  });

  it('riconosce la risposta anche dentro una frase parlata continua', () => {
    const res = evaluateVoiceInput(['allora secondo me è un ippopotamo sicuro'], sampleItem);
    expect(res.matched).toBe(true);
    expect(res.isPassCommand).toBe(false);
  });

  it('accetta errori di doppie o trascrizione fonetica', () => {
    const res = evaluateVoiceInput(['ipopotami'], sampleItem);
    expect(res.matched).toBe(true);
  });

  it('accetta singolare e plurale automaticamente', () => {
    const forbiciItem: DuelItem = {
      id: 'forbici',
      answer: 'Forbici',
      aliases: ['paio di forbici', 'cesoie'],
      imageUrl: 'https://upload.wikimedia.org/sample.jpg',
    };
    expect(evaluateVoiceInput(['la forbice'], forbiciItem).matched).toBe(true);
    expect(evaluateVoiceInput(['le forbici'], forbiciItem).matched).toBe(true);
  });

  it('accetta varianti italo-inglesi senza spazi o con spazi (es. Spider-Man)', () => {
    const spiderItem: DuelItem = {
      id: 'spiderman',
      answer: 'Spider-Man',
      aliases: ['uomo ragno', 'spiderman', 'spaidermen', 'peter parker'],
      imageUrl: 'https://upload.wikimedia.org/sample.jpg',
    };
    expect(evaluateVoiceInput(['spider man'], spiderItem).matched).toBe(true);
    expect(evaluateVoiceInput(['l uomo ragno'], spiderItem).matched).toBe(true);
    expect(evaluateVoiceInput(['spaidermen'], spiderItem).matched).toBe(true);
  });

  it('rileva immediatamente il comando vocale PASSO ma NON fa falso positivo su Passaporto', () => {
    expect(evaluateVoiceInput(['non lo so passo'], sampleItem).isPassCommand).toBe(true);

    const passaportoItem: DuelItem = {
      id: 'passaporto',
      answer: 'Passaporto',
      aliases: ['documento'],
      imageUrl: 'https://upload.wikimedia.org/sample.jpg',
    };
    const res = evaluateVoiceInput(['il passaporto'], passaportoItem);
    expect(res.isPassCommand).toBe(false);
    expect(res.matched).toBe(true);
  });

  it('riconosce comandi PASSO e risposte sia in italiano che in inglese', () => {
    const animalItem: DuelItem = {
      id: 'leone',
      answer: 'Leone',
      aliases: ['re della savana'],
      answerEn: 'Lion',
      aliasesEn: ['lions', 'king of the jungle'],
      imageUrl: 'https://upload.wikimedia.org/sample.jpg',
    };

    // Risposta in italiano
    expect(evaluateVoiceInput(['è un leone'], animalItem).matched).toBe(true);
    // Risposta in inglese
    expect(evaluateVoiceInput(['it is a lion'], animalItem).matched).toBe(true);
    expect(evaluateVoiceInput(['the lions'], animalItem).matched).toBe(true);

    // Comandi vocali di passo in inglese
    expect(evaluateVoiceInput(['pass'], animalItem).isPassCommand).toBe(true);
    expect(evaluateVoiceInput(['skip'], animalItem).isPassCommand).toBe(true);
    expect(evaluateVoiceInput(['i do not know skip'], animalItem).isPassCommand).toBe(true);
  });

  it('genera correttamente lo scheletro fonetico', () => {
    expect(phoneticSkeleton('ippopotamo')).toBe('ipopotamo');
    expect(phoneticSkeleton('smartphone')).toBe('smartfone');
  });

  it('contiene 56 categorie modulari con oltre 2100 fotografie HD validate e zero emoji-svg nei duelli', () => {
    expect(DEFAULT_CATEGORIES.length).toBe(56);
    let totalPhotos = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      expect(cat.items.length).toBeGreaterThanOrEqual(30);
      for (const item of cat.items) {
        expect(item.imageUrl).toMatch(/^https:\/\//);
        expect(item.imageUrl).not.toContain('twemoji');
        totalPhotos++;
      }
    }
    expect(totalPhotos).toBeGreaterThan(2100);
  });

  it('include pool multi-foto (anti-memorizzazione) per oltre 400 personaggi celebri', () => {
    let multiPhotoSubjects = 0;
    let totalPhotosInPools = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      for (const item of cat.items) {
        if (Array.isArray(item.imageUrls) && item.imageUrls.length > 1) {
          multiPhotoSubjects++;
          totalPhotosInPools += item.imageUrls.length;
          item.imageUrls.forEach((url) => {
            expect(url).toMatch(/^https:\/\//);
            expect(url).not.toContain('?');
          });
        }
      }
    }
    expect(multiPhotoSubjects).toBeGreaterThan(400);
    expect(totalPhotosInPools).toBeGreaterThan(1500);
  });

  it('ha un formato di versione semver valido (es. 1.0.0, 1.0.1)', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
