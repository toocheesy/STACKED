/*
 * Adventure Mode - World Map Renderer
 * Renders the world map UI with progress and navigation
 */

const WorldMap = {
  container: null,

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
    const unlocked = window.AdventureProgress.isWorldUnlocked(world.id);
    const worldStars = world.levels.reduce((sum, level) => {
      return sum + window.AdventureProgress.getLevelStars(level.id);
    }, 0);

    return `
      <div class="world-card ${unlocked ? 'unlocked' : 'locked'}" data-world="${world.id}">
        <div class="world-card-header">
          <span class="world-icon">${world.icon}</span>
          <div class="world-info">
            <h2 class="world-name">World ${world.id}: ${world.name}</h2>
            <p class="world-desc">${world.description}</p>
          </div>
          ${unlocked ? `<span class="world-stars">${worldStars}/9</span>` : '<span class="world-lock">Locked</span>'}
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
        this.startLevel(levelId);
      });
    });
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
