import { OutfitId, Upgrades } from '../types/game';

export interface SaveData {
  highScore: number;
  coins: number;
  unlockedOutfits: OutfitId[];
  equippedOutfit: OutfitId;
  heroName: string;
  upgrades: Upgrades;
  highestWave: number;
  level: number;
  lastSavedTimestamp: number;
}

const STORAGE_KEY = 'the_lone_battalion_save_v1';

// Legacy keys for backwards compatibility
const LEGACY_KEYS = {
  HERO_NAME: 'tlb_hero_name',
  HIGH_SCORE: 'tlb_high_score',
  COINS: 'tlb_coins',
  EQUIPPED_OUTFIT: 'tlb_equipped_outfit',
  UNLOCKED_OUTFITS: 'tlb_unlocked_outfits',
  UPGRADES: 'tlb_upgrades',
  HIGHEST_WAVE: 'tlb_highest_wave',
  CURRENT_LEVEL: 'tlb_level',
};

export const DEFAULT_UPGRADES: Upgrades = {
  fireRate: 0,
  damage: 0,
  ammoCap: 0,
  reloadSpeed: 0,
  sandbagWall: 0,
};

export const DEFAULT_SAVE_DATA: SaveData = {
  highScore: 0,
  coins: 0,
  unlockedOutfits: ['standard'],
  equippedOutfit: 'standard',
  heroName: 'Major Veer',
  upgrades: { ...DEFAULT_UPGRADES },
  highestWave: 1,
  level: 1,
  lastSavedTimestamp: 0,
};

class SaveLoadSystem {
  private cachedData: SaveData | null = null;

  /**
   * Checks whether saved game data exists in localStorage.
   */
  public hasSavedData(): boolean {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== null) {
        return true;
      }
      // Check legacy keys
      return localStorage.getItem(LEGACY_KEYS.HIGH_SCORE) !== null ||
             localStorage.getItem(LEGACY_KEYS.COINS) !== null ||
             localStorage.getItem(LEGACY_KEYS.UNLOCKED_OUTFITS) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Loads game data from localStorage.
   * If existing data is found, parses and validates it.
   * If missing or corrupted, initializes safe default save data.
   */
  public loadGame(): { data: SaveData; isNewSave: boolean } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated: SaveData = {
          highScore: typeof parsed.highScore === 'number' && !isNaN(parsed.highScore) ? Math.max(0, parsed.highScore) : 0,
          coins: typeof parsed.coins === 'number' && !isNaN(parsed.coins) ? Math.max(0, parsed.coins) : 0,
          unlockedOutfits: Array.isArray(parsed.unlockedOutfits) && parsed.unlockedOutfits.includes('standard')
            ? parsed.unlockedOutfits
            : ['standard'],
          equippedOutfit: ['standard', 'black_coat', 'desert_scarf', 'golden_bandana'].includes(parsed.equippedOutfit)
            ? parsed.equippedOutfit
            : 'standard',
          heroName: typeof parsed.heroName === 'string' && parsed.heroName.trim() ? parsed.heroName.trim() : 'Major Veer',
          upgrades: {
            fireRate: Math.max(0, Math.min(5, parsed.upgrades?.fireRate || 0)),
            damage: Math.max(0, Math.min(5, parsed.upgrades?.damage || 0)),
            ammoCap: Math.max(0, Math.min(5, parsed.upgrades?.ammoCap || 0)),
            reloadSpeed: Math.max(0, Math.min(5, parsed.upgrades?.reloadSpeed || 0)),
            sandbagWall: Math.max(0, Math.min(5, parsed.upgrades?.sandbagWall || 0)),
          },
          highestWave: typeof parsed.highestWave === 'number' && parsed.highestWave > 0 ? parsed.highestWave : 1,
          level: typeof parsed.level === 'number' && parsed.level > 0 ? parsed.level : 1,
          lastSavedTimestamp: parsed.lastSavedTimestamp || Date.now(),
        };

        this.cachedData = validated;
        return { data: validated, isNewSave: false };
      }

      // Check legacy migration if v1 key not yet created
      const legacySave = this.tryMigrateLegacy();
      if (legacySave) {
        this.saveGame(legacySave);
        return { data: legacySave, isNewSave: false };
      }
    } catch (err) {
      console.warn('Failed to load save data from localStorage, resetting to defaults', err);
    }

    const freshSave: SaveData = { ...DEFAULT_SAVE_DATA, lastSavedTimestamp: Date.now() };
    this.cachedData = freshSave;
    return { data: freshSave, isNewSave: true };
  }

  /**
   * Saves updated player data to localStorage whenever a relevant change occurs.
   * Can accept partial updates to merge with the existing save state.
   */
  public saveGame(partial: Partial<SaveData>): SaveData {
    try {
      if (!this.cachedData) {
        this.cachedData = this.loadGame().data;
      }

      const updated: SaveData = {
        ...this.cachedData,
        ...partial,
        // Ensure standard outfit is always preserved
        unlockedOutfits: partial.unlockedOutfits
          ? Array.from(new Set(['standard', ...partial.unlockedOutfits])) as OutfitId[]
          : this.cachedData.unlockedOutfits,
        lastSavedTimestamp: Date.now(),
      };

      // Guard values
      updated.highScore = Math.max(0, Math.round(updated.highScore));
      updated.coins = Math.max(0, Math.round(updated.coins));
      if (!updated.heroName.trim()) {
        updated.heroName = 'Major Veer';
      }

      this.cachedData = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Also sync legacy keys for maximum compatibility
      try {
        localStorage.setItem(LEGACY_KEYS.HIGH_SCORE, String(updated.highScore));
        localStorage.setItem(LEGACY_KEYS.COINS, String(updated.coins));
        localStorage.setItem(LEGACY_KEYS.UNLOCKED_OUTFITS, JSON.stringify(updated.unlockedOutfits));
        localStorage.setItem(LEGACY_KEYS.EQUIPPED_OUTFIT, updated.equippedOutfit);
        localStorage.setItem(LEGACY_KEYS.HERO_NAME, updated.heroName);
        localStorage.setItem(LEGACY_KEYS.UPGRADES, JSON.stringify(updated.upgrades));
        localStorage.setItem(LEGACY_KEYS.HIGHEST_WAVE, String(updated.highestWave));
      } catch {}

      return updated;
    } catch (err) {
      console.error('Failed to write save data to localStorage:', err);
      return this.cachedData || DEFAULT_SAVE_DATA;
    }
  }

  /**
   * Helper to migrate from legacy individual keys if present
   */
  private tryMigrateLegacy(): SaveData | null {
    try {
      const heroName = localStorage.getItem(LEGACY_KEYS.HERO_NAME);
      const highScoreRaw = localStorage.getItem(LEGACY_KEYS.HIGH_SCORE);
      const coinsRaw = localStorage.getItem(LEGACY_KEYS.COINS);
      const unlockedRaw = localStorage.getItem(LEGACY_KEYS.UNLOCKED_OUTFITS);
      const equipped = localStorage.getItem(LEGACY_KEYS.EQUIPPED_OUTFIT) as OutfitId;
      const upgradesRaw = localStorage.getItem(LEGACY_KEYS.UPGRADES);
      const highestWaveRaw = localStorage.getItem(LEGACY_KEYS.HIGHEST_WAVE);

      if (heroName || highScoreRaw || coinsRaw || unlockedRaw) {
        return {
          heroName: heroName?.trim() || 'Major Veer',
          highScore: highScoreRaw ? parseInt(highScoreRaw, 10) || 0 : 0,
          coins: coinsRaw ? parseInt(coinsRaw, 10) || 0 : 0,
          unlockedOutfits: unlockedRaw ? JSON.parse(unlockedRaw) : ['standard'],
          equippedOutfit: (equipped && ['standard', 'black_coat', 'desert_scarf', 'golden_bandana'].includes(equipped))
            ? equipped
            : 'standard',
          upgrades: upgradesRaw ? JSON.parse(upgradesRaw) : { ...DEFAULT_UPGRADES },
          highestWave: highestWaveRaw ? parseInt(highestWaveRaw, 10) || 1 : 1,
          level: 1,
          lastSavedTimestamp: Date.now(),
        };
      }
    } catch {}
    return null;
  }

  /**
   * Resets save data back to fresh baseline.
   */
  public resetSaveData(): SaveData {
    try {
      localStorage.removeItem(STORAGE_KEY);
      Object.values(LEGACY_KEYS).forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
    } catch {}
    const fresh: SaveData = { ...DEFAULT_SAVE_DATA, lastSavedTimestamp: Date.now() };
    this.cachedData = fresh;
    this.saveGame(fresh);
    return fresh;
  }

  // --- Convenience Getters & Setters ---

  public getHeroName(): string {
    return this.cachedData?.heroName || this.loadGame().data.heroName;
  }

  public setHeroName(name: string) {
    this.saveGame({ heroName: name.trim() || 'Major Veer' });
  }

  public getHighScore(): number {
    return this.cachedData?.highScore ?? this.loadGame().data.highScore;
  }

  public setHighScore(score: number): boolean {
    const current = this.getHighScore();
    if (score > current) {
      this.saveGame({ highScore: score });
      return true;
    }
    return false;
  }

  public getCoins(): number {
    return this.cachedData?.coins ?? this.loadGame().data.coins;
  }

  public addCoins(amount: number): number {
    const current = this.getCoins();
    const updated = Math.max(0, current + amount);
    this.saveGame({ coins: updated });
    return updated;
  }

  public spendCoins(amount: number): boolean {
    const current = this.getCoins();
    if (current >= amount) {
      this.saveGame({ coins: current - amount });
      return true;
    }
    return false;
  }

  public getUnlockedOutfits(): OutfitId[] {
    return this.cachedData?.unlockedOutfits || this.loadGame().data.unlockedOutfits;
  }

  public unlockOutfit(id: OutfitId) {
    const list = this.getUnlockedOutfits();
    if (!list.includes(id)) {
      this.saveGame({ unlockedOutfits: [...list, id] });
    }
  }

  public getEquippedOutfit(): OutfitId {
    return this.cachedData?.equippedOutfit || this.loadGame().data.equippedOutfit;
  }

  public setEquippedOutfit(id: OutfitId) {
    this.saveGame({ equippedOutfit: id });
  }

  public getUpgrades(): Upgrades {
    return this.cachedData?.upgrades || this.loadGame().data.upgrades;
  }

  public saveUpgrades(upgrades: Upgrades) {
    this.saveGame({ upgrades });
  }

  public getHighestWave(): number {
    return this.cachedData?.highestWave ?? this.loadGame().data.highestWave;
  }

  public setHighestWave(wave: number) {
    const current = this.getHighestWave();
    if (wave > current) {
      this.saveGame({ highestWave: wave });
    }
  }
}

export const storage = new SaveLoadSystem();
