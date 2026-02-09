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
      highestCompleted: null,
      introsSeen: []        // [1, 2, 3] — world IDs whose intros have been shown
    };
  },

  loadProgress() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        // Migrate: add introsSeen if missing from old save data
        if (!progress.introsSeen) {
          progress.introsSeen = [];
        }
        return progress;
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

      // Unlock next world ONLY if it's not locked (caps at world 4)
      if (nextWorldId <= 6 && !progress.unlockedWorlds.includes(nextWorldId)) {
        const nextWorld = window.AdventureLevels.getWorld(nextWorldId);
        if (nextWorld && !window.AdventureLevels.isWorldLocked(nextWorldId)) {
          progress.unlockedWorlds.push(nextWorldId);
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
    }

    return unlocks;
  },

  // Check if a level is unlocked
  isLevelUnlocked(levelId) {
    // Check if level config has locked: true
    const level = window.AdventureLevels.getLevel(levelId);
    if (!level) return false;
    if (level.locked) return false;

    // Level 1-1 is always unlocked
    if (levelId === '1-1') return true;

    const progress = this.loadProgress();

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

  // Get total possible stars (only count unlockable levels)
  getMaxStars() {
    return window.AdventureLevels.worlds.reduce((total, world) => {
      const playableLevels = world.levels.filter(l => !l.locked);
      return total + playableLevels.length * 3;
    }, 0);
  },

  // Check if a world is unlocked
  isWorldUnlocked(worldId) {
    // Locked worlds are never considered unlocked
    if (window.AdventureLevels.isWorldLocked(worldId)) return false;
    if (worldId === 1) return true;
    const progress = this.loadProgress();
    return progress.unlockedWorlds.includes(worldId);
  },

  // Check if intro has been seen for a world
  hasSeenIntro(worldId) {
    const progress = this.loadProgress();
    return progress.introsSeen.includes(worldId);
  },

  // Mark intro as seen for a world
  markIntroSeen(worldId) {
    const progress = this.loadProgress();
    if (!progress.introsSeen.includes(worldId)) {
      progress.introsSeen.push(worldId);
      this.saveProgress(progress);
    }
  },

  // Reset all progress
  resetProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

window.AdventureProgress = AdventureProgress;
