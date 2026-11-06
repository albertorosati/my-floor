import { describe, it, expect } from 'vitest';
import {
  getItemImagePool,
  getRandomItemImage,
  prepareArenaDeck,
} from './itemUtils';
import { DuelItem } from '../types/game';

describe('itemUtils - Multi-Photo Anti-Memorization', () => {
  const itemSingle: DuelItem = {
    id: 'single-1',
    answer: 'Leonardo DiCaprio',
    aliases: ['dicaprio'],
    imageUrl: 'https://example.com/leo1.jpg',
  };

  const itemMulti: DuelItem = {
    id: 'multi-1',
    answer: 'Brad Pitt',
    aliases: ['pitt'],
    imageUrl: 'https://example.com/brad1.jpg',
    imageUrls: [
      'https://example.com/brad1.jpg',
      'https://example.com/brad2.jpg',
      'https://example.com/brad3.jpg',
    ],
  };

  it('estrae il pool di immagini corretto e deduplicato', () => {
    const singlePool = getItemImagePool(itemSingle);
    expect(singlePool).toEqual(['https://example.com/leo1.jpg']);

    const multiPool = getItemImagePool(itemMulti);
    expect(multiPool).toHaveLength(3);
    expect(multiPool).toContain('https://example.com/brad1.jpg');
    expect(multiPool).toContain('https://example.com/brad2.jpg');
    expect(multiPool).toContain('https://example.com/brad3.jpg');
  });

  it('seleziona una foto casuale appartenente al pool', () => {
    const selected = getRandomItemImage(itemMulti);
    expect(['https://example.com/brad1.jpg', 'https://example.com/brad2.jpg', 'https://example.com/brad3.jpg']).toContain(selected);

    const singleSelected = getRandomItemImage(itemSingle);
    expect(singleSelected).toBe('https://example.com/leo1.jpg');
  });

  it('prepareArenaDeck randomizza le foto del mazzo preservando gli elementi', () => {
    const items: DuelItem[] = [
      itemSingle,
      itemMulti,
      {
        id: 'multi-2',
        answer: 'Gerry Scotti',
        aliases: ['scotti'],
        imageUrl: 'https://example.com/gerry1.jpg',
        imageUrls: [
          'https://example.com/gerry1.jpg',
          'https://example.com/gerry2.jpg',
          'https://example.com/gerry3.jpg',
        ],
      },
    ];

    const deck = prepareArenaDeck(items);
    expect(deck).toHaveLength(3);
    const answers = deck.map((d) => d.answer);
    expect(answers).toContain('Leonardo DiCaprio');
    expect(answers).toContain('Brad Pitt');
    expect(answers).toContain('Gerry Scotti');

    const bradItem = deck.find((d) => d.answer === 'Brad Pitt')!;
    expect(itemMulti.imageUrls).toContain(bradItem.imageUrl);
  });
});
