import { describe, it, expect, beforeEach } from 'vitest';
import {
  blacklistService,
  getCanonicalImageKey,
} from './blacklistService';

describe('blacklistService', () => {
  beforeEach(() => {
    blacklistService.clearUserFlags();
  });

  describe('getCanonicalImageKey', () => {
    it('estrae la stessa chiave canonica per thumbnail e URL originario di Wikimedia Commons', () => {
      const orig =
        'https://upload.wikimedia.org/wikipedia/commons/c/ce/Tetraodon-hispidus.jpg';
      const thumb =
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Tetraodon-hispidus.jpg/960px-Tetraodon-hispidus.jpg';

      expect(getCanonicalImageKey(orig)).toBe('commons:tetraodon-hispidus.jpg');
      expect(getCanonicalImageKey(thumb)).toBe('commons:tetraodon-hispidus.jpg');
      expect(getCanonicalImageKey(orig)).toBe(getCanonicalImageKey(thumb));
    });

    it('gestisce URL con parametri di query e hash', () => {
      const urlWithQuery = 'https://example.com/photos/dog.jpg?v=2#details';
      expect(getCanonicalImageKey(urlWithQuery)).toBe(
        'https://example.com/photos/dog.jpg'
      );
    });
  });

  describe('isBlacklisted', () => {
    it('riconosce gli URL presenti nella blacklist statica (anche come thumbnail)', () => {
      const thumbUrl =
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Tetraodon-hispidus.jpg/960px-Tetraodon-hispidus.jpg';
      expect(blacklistService.isBlacklisted(thumbUrl)).toBe(true);

      const collageThumb =
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Starfish_montage.png/960px-Starfish_montage.png';
      expect(blacklistService.isBlacklisted(collageThumb)).toBe(true);

      // Copertine con titoli spoiler supereroi bloccate
      const spidermanCover =
        'https://upload.wikimedia.org/wikipedia/it/8/82/Copertina_Uomo_Ragno_MI_430.png';
      expect(blacklistService.isBlacklisted(spidermanCover)).toBe(true);

      const batmanCover =
        'https://upload.wikimedia.org/wikipedia/it/1/19/Batman_3_variant.jpg';
      expect(blacklistService.isBlacklisted(batmanCover)).toBe(true);

      const cleanPhoto =
        'https://upload.wikimedia.org/wikipedia/commons/1/12/Living_clean_fish.jpg';
      expect(blacklistService.isBlacklisted(cleanPhoto)).toBe(false);
    });

    it('permette all utente di segnalare una foto e la blocca istantaneamente', () => {
      const badPhoto =
        'https://upload.wikimedia.org/wikipedia/commons/a/ab/Dissected_frog_jar.jpg';
      expect(blacklistService.isBlacklisted(badPhoto)).toBe(false);

      blacklistService.flagImage(badPhoto, {
        itemId: 'frog-1',
        answer: 'Rana',
        reason: 'dissection jar',
      });

      expect(blacklistService.isBlacklisted(badPhoto)).toBe(true);
      // Il thumbnail corrispondente deve risultare bloccato automaticamente
      const badThumb =
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Dissected_frog_jar.jpg/960px-Dissected_frog_jar.jpg';
      expect(blacklistService.isBlacklisted(badThumb)).toBe(true);

      expect(blacklistService.getFlaggedCount()).toBe(1);
      const flagged = blacklistService.getFlaggedImages();
      expect(flagged[0].answer).toBe('Rana');
      expect(flagged[0].itemId).toBe('frog-1');
    });

    it('permette di rimuovere la segnalazione o ripulirle tutte', () => {
      const badPhoto = 'https://example.com/bad1.jpg';
      blacklistService.flagImage(badPhoto);
      expect(blacklistService.isBlacklisted(badPhoto)).toBe(true);

      blacklistService.unflagImage(badPhoto);
      expect(blacklistService.isBlacklisted(badPhoto)).toBe(false);

      blacklistService.flagImage(badPhoto);
      expect(blacklistService.getFlaggedCount()).toBe(1);
      blacklistService.clearUserFlags();
      expect(blacklistService.getFlaggedCount()).toBe(0);
      expect(blacklistService.isBlacklisted(badPhoto)).toBe(false);
    });

    it('esporta il JSON della blacklist integrando le segnalazioni utente', () => {
      const userPhoto = 'https://example.com/user_bad.jpg';
      blacklistService.flagImage(userPhoto, { answer: 'Esempio' });

      const exportedJson = blacklistService.exportBlacklistJson();
      const parsed = JSON.parse(exportedJson);

      expect(parsed.version).toBe(1);
      expect(parsed.blacklistedUrls).toContain(userPhoto);
      expect(parsed.reports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: userPhoto,
            answer: 'Esempio',
          }),
        ])
      );
    });
  });
});
