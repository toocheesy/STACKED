/*
 * Adventure Mode - World Map Renderer
 * Renders the world map UI with progress, navigation,
 * locked world visuals, and character intro modals
 */

const WorldMap = {
  container: null,

  // Character intro data for each world
  _intros: {
    1: {
      characters: [{ name: 'Calvin', title: 'The Calculator' }],
      quote: "H-hey! I'm still learning too. Let's figure this out together!"
    },
    2: {
      characters: [{ name: 'Talia', title: 'The Teacher' }],
      quote: "Welcome! I'll show you some new tricks. Pay attention!"
    },
    3: {
      characters: [{ name: 'Nina', title: 'The Natural' }],
      quote: "Hope you've been practicing. I don't go easy."
    },
    4: {
      characters: [
        { name: 'Rex', title: 'The Shark' },
        { name: 'Jett', title: 'The Blitz' },
        { name: 'Mira', title: 'The Guardian' }
      ],
      quote: "The summit awaits. Three new challengers stand in your way."
    }
  },

  init() {
    this.container = document.getElementById('world-map');
    if (!this.container) return;
    this.render();
  },

  render() {
    if (!this.container) return;

    const worlds = window.AdventureLevels.worlds;
    const totalStars = window.AdventureProgress.getTotalStars();
    const maxStars = window.AdventureProgress.getMaxStars();

    this.container.innerHTML = `
      <div class="map-header">
        <a href="index.html" class="map-back-btn">Back</a>
        <h1 class="map-title">Adventure Mode</h1>
        <div class="map-stars-total">${totalStars} / ${maxStars} Stars</div>
      </div>
      <div class="worlds-grid">
        ${worlds.map(world => this.renderWorld(world)).join('')}
      </div>
    `;

    this.attachHandlers();
  },

  renderWorld(world) {
    const isLocked = window.AdventureLevels.isWorldLocked(world.id);
    const unlocked = !isLocked && window.AdventureProgress.isWorldUnlocked(world.id);

    const playableLevels = world.levels.filter(l => !l.locked);
    const maxWorldStars = playableLevels.length * 3;
    const worldStars = world.levels.reduce((sum, level) => {
      return sum + window.AdventureProgress.getLevelStars(level.id);
    }, 0);

    if (isLocked) {
      return `
        <div class="world-card world-locked" data-world="${world.id}">
          <div class="world-card-header">
            <span class="world-icon">${world.icon}</span>
            <div class="world-info">
              <h2 class="world-name">World ${world.id}: ${world.name}</h2>
              <p class="world-desc">${world.description}</p>
            </div>
            <span class="world-lock">Locked</span>
          </div>
          <div class="world-locked-content">
            <span class="lock-icon">&#128274;</span>
            <span class="coming-soon-text">Coming Soon</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="world-card ${unlocked ? 'unlocked' : 'locked'}" data-world="${world.id}">
        <div class="world-card-header">
          <span class="world-icon">${world.icon}</span>
          <div class="world-info">
            <h2 class="world-name">World ${world.id}: ${world.name}</h2>
            <p class="world-desc">${world.description}</p>
          </div>
          ${unlocked ? `<span class="world-stars">${worldStars}/${maxWorldStars}</span>` : '<span class="world-lock">Locked</span>'}
        </div>
        <div class="level-buttons">
          ${world.levels.map((level, i) => this.renderLevelButton(level, i, unlocked)).join('')}
        </div>
      </div>
    `;
  },

  renderLevelButton(level, index, worldUnlocked) {
    const unlocked = worldUnlocked && window.AdventureProgress.isLevelUnlocked(level.id);
    const stars = window.AdventureProgress.getLevelStars(level.id);
    const starDisplay = this.renderStars(stars);

    return `
      <button class="level-btn ${unlocked ? 'unlocked' : 'locked'} ${stars > 0 ? 'completed' : ''}"
              data-level="${level.id}"
              ${!unlocked ? 'disabled' : ''}>
        <span class="level-num">${index + 1}</span>
        <span class="level-name">${level.name}</span>
        <span class="level-target">${level.targetScore} pts</span>
        <span class="level-stars">${starDisplay}</span>
      </button>
    `;
  },

  renderStars(count) {
    let stars = '';
    for (let i = 0; i < 3; i++) {
      stars += i < count ? '<span class="star filled">*</span>' : '<span class="star empty">*</span>';
    }
    return stars;
  },

  attachHandlers() {
    const levelBtns = this.container.querySelectorAll('.level-btn.unlocked');
    levelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const levelId = btn.dataset.level;
        this.handleLevelClick(levelId);
      });
    });

    // Locked world click handler — show toast
    const lockedWorlds = this.container.querySelectorAll('.world-card.world-locked');
    lockedWorlds.forEach(card => {
      card.addEventListener('click', () => {
        this.showToast('New challengers arriving soon...');
      });
    });
  },

  handleLevelClick(levelId) {
    const levelConfig = window.AdventureLevels.getLevel(levelId);
    if (!levelConfig) return;

    const worldId = levelConfig.worldId;

    // Check if we need to show character intro
    if (!window.AdventureProgress.hasSeenIntro(worldId) && this._intros[worldId]) {
      this.showCharacterIntro(worldId, () => {
        this.startLevel(levelId);
      });
    } else {
      this.startLevel(levelId);
    }
  },

  showCharacterIntro(worldId, onComplete) {
    const intro = this._intros[worldId];
    if (!intro) {
      onComplete();
      return;
    }

    const characterNames = intro.characters.map(c =>
      `<div class="intro-character">
        <span class="intro-char-name">${c.name}</span>
        <span class="intro-char-title">${c.title}</span>
      </div>`
    ).join('');

    const meetText = intro.characters.length > 1 ? 'Meet Your Challengers' : `Meet ${intro.characters[0].name}`;

    const overlay = document.createElement('div');
    overlay.className = 'character-intro-overlay';
    overlay.innerHTML = `
      <div class="character-intro-modal">
        <h2 class="intro-heading">${meetText}</h2>
        <div class="intro-characters">${characterNames}</div>
        <p class="intro-quote">"${intro.quote}"</p>
        <button class="intro-go-btn">Let's Go!</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Force reflow for animation
    overlay.offsetHeight;
    overlay.classList.add('visible');

    overlay.querySelector('.intro-go-btn').addEventListener('click', () => {
      window.AdventureProgress.markIntroSeen(worldId);
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
        onComplete();
      }, 300);
    });
  },

  showToast(message) {
    // Simple toast notification
    const existing = document.querySelector('.adventure-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'adventure-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  startLevel(levelId) {
    const levelConfig = window.AdventureLevels.getLevel(levelId);
    if (!levelConfig) return;

    // Store level config for game.html to read
    localStorage.setItem('adventureLevel', JSON.stringify(levelConfig));
    localStorage.setItem('selectedMode', 'adventure');
    localStorage.setItem('bot1Personality', levelConfig.bot1);
    localStorage.setItem('bot2Personality', levelConfig.bot2);

    window.location.href = 'game.html';
  }
};

window.WorldMap = WorldMap;
