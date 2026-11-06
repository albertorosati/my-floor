import { describe, it, expect } from 'vitest';
import {
  t,
  filterCategories,
  getCategoryTitle,
  getCategorySubtitle,
  localizeCategoryForGame,
  localizePlayerName,
} from './i18n';
import { Category } from '../types/game';

describe('i18n & Category Scope Filtering', () => {
  const catIntl: Category = {
    id: 'world-flags',
    name: 'Bandiere del Mondo',
    subtitle: 'Bandiere nazionali da tutto il pianeta',
    nameEn: 'World Flags',
    subtitleEn: 'National flags from around the planet',
    icon: '🌍',
    themeHex: '#10B981',
    scope: 'intl',
    items: [
      {
        id: 'flag-1',
        answer: 'Italia',
        aliases: ['repubblica italiana'],
        answerEn: 'Italy',
        aliasesEn: ['italian republic'],
        imageUrl: 'https://example.com/italy.jpg',
      },
    ],
  };

  const catItOnly: Category = {
    id: 'musica-italiana',
    name: 'Cantanti & Rapper Italiani',
    subtitle: 'I protagonisti della musica italiana',
    icon: '🇮🇹',
    themeHex: '#008C45',
    scope: 'it-only',
    items: [
      {
        id: 'sfera',
        answer: 'Sfera Ebbasta',
        aliases: ['sfera'],
        imageUrl: 'https://example.com/sfera.jpg',
      },
    ],
  };

  const allCategories: Category[] = [catIntl, catItOnly];

  it('traduce le chiavi con parametri in italiano e in inglese', () => {
    expect(t('lobby.pointsCount', 'it', { n: 5 })).toBe('5 punti');
    expect(t('lobby.pointsCount', 'en', { n: 5 })).toBe('5 points');
    expect(t('arena.passButton', 'it')).toBe('PASSO (-3s)');
    expect(t('arena.passButton', 'en')).toBe('PASS (-3s)');
    expect(t('lobby.howToPlay', 'en')).toBe('How do you play?');
    expect(t('lobby.sameRoom', 'en')).toBe('Same room');
    expect(t('lobby.onDiscord', 'en')).toBe('On Discord');
    expect(t('lobby.p1', 'en')).toBe('Player 1');
    expect(t('lobby.p2', 'en')).toBe('Player 2');
    expect(t('app.headerStats', 'en', { categories: 51, photos: '2,131' })).toBe(
      '51 categories • 2,131 HD photos'
    );
  });

  it('localizza i nomi predefiniti dei giocatori mantenendo i nomi custom', () => {
    expect(localizePlayerName('Giocatore 1', 'en')).toBe('Player 1');
    expect(localizePlayerName('Giocatore 2', 'en')).toBe('Player 2');
    expect(localizePlayerName('Giocatore 4', 'en')).toBe('Player 4');
    expect(localizePlayerName('Player 1', 'it')).toBe('Giocatore 1');
    expect(localizePlayerName('Mario', 'en')).toBe('Mario');
    expect(localizePlayerName('Federica', 'en')).toBe('Federica');
  });

  it('in lingua inglese esclude categoricamente le categorie italiane esclusive (scope: it-only)', () => {
    const enCategories = filterCategories(allCategories, 'en');
    expect(enCategories.map((c) => c.id)).toContain('world-flags');
    expect(enCategories.map((c) => c.id)).not.toContain('musica-italiana');
  });

  it('in lingua italiana include tutte le categorie (sia internazionali che esclusive italiane)', () => {
    const itCategories = filterCategories(allCategories, 'it');
    expect(itCategories.map((c) => c.id)).toContain('world-flags');
    expect(itCategories.map((c) => c.id)).toContain('musica-italiana');
  });

  it('restituisce titoli e sottotitoli localizzati', () => {
    expect(getCategoryTitle(catIntl, 'it')).toBe('Bandiere del Mondo');
    expect(getCategoryTitle(catIntl, 'en')).toBe('World Flags');
    expect(getCategorySubtitle(catIntl, 'en')).toBe('National flags from around the planet');
  });

  it('localizza una categoria per il duello in lingua inglese', () => {
    const localized = localizeCategoryForGame(catIntl, 'en');
    expect(localized.name).toBe('World Flags');
    expect(localized.items[0].answer).toBe('Italy');
    expect(localized.items[0].aliases).toContain('italian republic');
    expect(localized.items[0].aliases).toContain('Italia');
  });
});
