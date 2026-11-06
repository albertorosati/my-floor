import { describe, it, expect } from 'vitest';
import { evaluateImageQuality } from '../scripts/image-quality-validator.mjs';

describe('evaluateImageQuality', () => {
  it('rifiuta immagini con aspect ratio estremo schiacciato (> 1.85)', () => {
    // Banner ultrawide pancake 1920x620 (ratio 3.10)
    const result = evaluateImageQuality({
      url: 'https://example.com/gameplay.jpg',
      width: 1920,
      height: 620,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('extreme_aspect_ratio');
  });

  it('rifiuta immagini con aspect ratio troppo stretto / verticale (< 0.65)', () => {
    // Striscia verticale 400x1000 (ratio 0.40)
    const result = evaluateImageQuality({
      url: 'https://example.com/strip.jpg',
      width: 400,
      height: 1000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('extreme_aspect_ratio');
  });

  it('rifiuta keyword vietate per banner steam come library_hero e hero_capsule', () => {
    const result = evaluateImageQuality({
      url: 'https://cdn.example.org/games/custom_game_library_hero.jpg',
      width: 1920,
      height: 1080,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('forbidden_keyword: library_hero');
  });

  it('accetta screenshot in-game 16:9 full HD (1920x1080) con punteggio elevato', () => {
    const result = evaluateImageQuality({
      url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/ss_32aa18ab3175e3002217862dd5917646d298ab6b.1920x1080.jpg',
      width: 1920,
      height: 1080,
    });
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(65);
  });

  it('accetta foto standard 4:3 (800x600)', () => {
    const result = evaluateImageQuality({
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Retro_game.jpg',
      width: 800,
      height: 600,
    });
    expect(result.valid).toBe(true);
  });

  it('rifiuta spoiler se il titolo contiene risposta e parola cover/variant/comic/film', () => {
    const result = evaluateImageQuality({
      url: 'https://example.org/images/art_sample.jpg',
      title: 'Batman comic variant issue 1',
      answer: 'Batman',
      width: 1200,
      height: 800,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('spoiler_cover_or_poster_for_batman');
  });
});
