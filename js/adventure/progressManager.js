/*
 * Adventure Mode - Progress Manager
 * Handles save/load/unlock logic via localStorage
 */

const AdventureProgress = {
  STORAGE_KEY: 'stackedAdventure',

  // Default progress state
  _defaultProgress() {
    return {
      completedLevels: {},  // { "1-1": { stars: 3, placement: 1 }, ... }
      unlockedWorlds: [1],
      highestCompleted: null
    };
  },

  loadProgress() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load adventure progress:', e);
    }
    return this._defaultProgress();
  },

  saveProgress(progress) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save adventure progress:', e);
    }
  },

  // Calculate stars from placement: 1st=3 stars, 2nd=2 stars, 3rd=1 star
  calculateStars(placement) {
    if (placement === 1) return 3;
    if (placement === 2) return 2;
    return 1;
  },

  // Complete a level and save progress
  completeLevel(levelId, placement) {
    const progress = this.loadProgress();
    const stars = this.calculateStars(placement);

    // Only save if better than existing
    const existing = progress.completedLevels[levelId];
    if (!existing || stars > existing.stars) {
      progress.completedLevels[levelId] = { stars, placement };
    }

    progress.highestCompleted = levelId;

    // Check for world unlocks
    const unlocks = this.checkUnlocks(levelId, progress);

    this.saveProgress(progress);

    return { stars, unlocks };
  },

  // Check if completing a level unlocks new content
  checkUnlocks(levelId, progress) {
    const unlocks = [];
    const level = window.AdventureLevels.getLevel(levelId);
    if (!level) return unlocks;

    // Check if this completes a world (is it the last level in the world?)
    const world = window.AdventureLevels.getWorld(level.worldId);
    const isLastLevel = world && world.levels[world.levels.length - 1].id === levelId;
    if (isLastLevel) {
      const worldId = level.worldId;
      const nextWorldId = worldId + 1;

      // Unlock next world
      if (nextWorldId <= 6 && !progress.unlockedWorlds.includes(nextWorldId)) {
        progress.unlockedWorlds.push(nextWorldId);
        const nextWorld = window.AdventureLevels.getWorld(nextWorldId);
        if (nextWorld) {
          unlocks.push({
            type: 'world',
            worldId: nextWorldId,
            name: nextWorld.name,
            icon: nextWorld.icon
          });
        }
      }

      // Special unlocks
      if (worldId === 3) {
        unlocks.push({ type: 'feature', name: 'Free Play unlocked!' });
      }
      if (worldId === 5) {
        unlocks.push({ type: 'feature', name: 'Legendary difficulty unlocked!' });
      }
    }

    return unlocks;
  },

  // Check if a level is unlocked
  isLevelUnlocked(levelId) {
    // Level 1-1 is always unlocked
    if (levelId === '1-1') return true;

    const progress = this.loadProgress();
    const level = window.AdventureLevels.getLevel(levelId);
    if (!level) return false;

    // Check if the world is unlocked
    if (!progress.unlockedWorlds.includes(level.worldId)) return false;

    // Check if previous level is completed
    const allLevels = window.AdventureLevels.worlds.flatMap(w =>
      w.levels.map(l => l.id)
    );
    const idx = allLevels.indexOf(levelId);
    if (idx <= 0) return true; // First level

    const prevLevelId = allLevels[idx - 1];
    return !!progress.completedLevels[prevLevelId];
  },

  // Get stars for a completed level
  getLevelStars(levelId) {
    const progress = this.loadProgress();
    const data = progress.completedLevels[levelId];
    return data ? data.stars : 0;
  },

  // Get total stars earned
  getTotalStars() {
    const progress = this.loadProgress();
    return Object.values(progress.completedLevels)
      .reduce((total, data) => total + data.stars, 0);
  },

  // Get total possible stars
  getMaxStars() {
    return window.AdventureLevels.worlds.reduce((total, world) => {
      return total + world.levels.length * 3; // 3 stars per level
    }, 0);
  },

  // Check if a world is unlocked
  isWorldUnlocked(worldId) {
    if (worldId === 1) return true;
    const progress = this.loadProgress();
    return progress.unlockedWorlds.includes(worldId);
  },

  // Reset all progress
  resetProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

window.AdventureProgress = AdventureProgress;
