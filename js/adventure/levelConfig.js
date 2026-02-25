/*
 * Adventure Mode - Level Configuration
 * 18 levels across 6 worlds with progressive difficulty
 * Worlds 1-4 playable, worlds 5-6 locked (Coming Soon)
 */

const AdventureLevels = {
  worlds: [
    {
      id: 1,
      name: 'Pair Valley',
      description: 'Learn to match pairs',
      icon: '🌿',
      cssClass: 'adventure-world-1',
      levels: [
        {
          id: '1-1',
          name: 'First Match',
          targetScore: 100,
          bot1: 'calvin', bot2: 'calvin',
          restrictions: ['pairsOnly'],
          locked: false,
          tutorial: 'Match pairs to capture cards! Drag a card to the Match area and its pair to capture both.'
        },
        {
          id: '1-2',
          name: 'Pair Pro',
          targetScore: 125,
          bot1: 'calvin', bot2: 'calvin',
          restrictions: ['pairsOnly'],
          locked: false,
          tutorial: 'Face cards (K, Q, J) are worth 10 points each. Capture them when you can!'
        }
      ]
    },
    {
      id: 2,
      name: 'Sum Springs',
      description: 'Discover number sums',
      icon: '🌊',
      cssClass: 'adventure-world-2',
      levels: [
        {
          id: '2-1',
          name: 'Adding Up',
          targetScore: 100,
          bot1: 'calvin', bot2: 'talia',
          restrictions: ['noSum2', 'noSum3'],
          locked: false,
          tutorial: 'New mechanic: Sum captures! Place a base card, then add board cards that equal its value.'
        },
        {
          id: '2-2',
          name: 'Double Trouble',
          targetScore: 125,
          bot1: 'talia', bot2: 'talia',
          restrictions: ['noSum3'],
          locked: false,
          tutorial: 'Aces are worth 1 in sums but 15 points when scored. Capture them!'
        },
        {
          id: '2-3',
          name: 'Full Power',
          targetScore: 150,
          bot1: 'talia', bot2: 'calvin',
          restrictions: [],
          locked: false,
          tutorial: 'All combo areas unlocked! Use Base + Sum1 + Sum2 + Sum3 for massive multi-captures.'
        }
      ]
    },
    {
      id: 3,
      name: 'Combo Canyon',
      description: 'Full combo builder unlocked',
      icon: '🏜️',
      cssClass: 'adventure-world-3',
      levels: [
        {
          id: '3-1',
          name: 'The Natural',
          targetScore: 150,
          bot1: 'calvin', bot2: 'nina',
          restrictions: [],
          locked: false,
          tutorial: 'Nina doesn\'t mess around. Watch how she captures and learn!'
        },
        {
          id: '3-2',
          name: 'Combo Breaker',
          targetScore: 175,
          bot1: 'nina', bot2: 'talia',
          restrictions: [],
          locked: false,
          tutorial: 'Try to capture multiple groups in one turn using all the combo areas.'
        },
        {
          id: '3-3',
          name: 'Canyon King',
          targetScore: 200,
          bot1: 'nina', bot2: 'nina',
          restrictions: [],
          locked: false,
          tutorial: 'Two Ninas. Plan your captures carefully — they won\'t leave you much.'
        }
      ]
    },
    {
      id: 4,
      name: 'Strategy Summit',
      description: 'Outsmart tougher bots',
      icon: '🏔️',
      cssClass: 'adventure-world-4',
      levels: [
        {
          id: '4-1',
          name: 'The Gambler',
          targetScore: 200,
          bot1: 'nina', bot2: 'rex',
          restrictions: [],
          locked: false,
          tutorial: 'Rex has entered the game. He reads the board and plays strategically.'
        },
        {
          id: '4-2',
          name: 'Blitz Attack',
          targetScore: 200,
          bot1: 'jett', bot2: 'nina',
          restrictions: [],
          locked: false,
          tutorial: 'Jett moves fast and hits hard. Keep up or get left behind!'
        },
        {
          id: '4-3',
          name: 'The Wall',
          targetScore: 225,
          bot1: 'mira', bot2: 'rex',
          restrictions: [],
          locked: false,
          tutorial: 'Mira guards every point. You\'ll need to find the gaps in her defense.'
        },
        {
          id: '4-4',
          name: 'Summit Showdown',
          targetScore: 250,
          bot1: 'jett', bot2: 'mira',
          restrictions: [],
          locked: false,
          tutorial: 'The ultimate duo. Speed meets defense. Show them what you\'ve learned!'
        }
      ]
    },
    {
      id: 5,
      name: 'Legend\'s Lair',
      description: 'Face the ultimate challenge',
      icon: '🐉',
      cssClass: 'adventure-world-5',
      levels: [
        {
          id: '5-1',
          name: 'Dragon\'s Gate',
          targetScore: 250,
          bot1: 'rex', bot2: 'rex',
          restrictions: [],
          locked: true,
          tutorial: 'Rex leads the pack now. Stay sharp!'
        },
        {
          id: '5-2',
          name: 'Fire Trial',
          targetScore: 275,
          bot1: 'rex', bot2: 'rex',
          restrictions: [],
          locked: true,
          tutorial: 'Two Rex bots. This is the real challenge.'
        },
        {
          id: '5-3',
          name: 'Legend Born',
          targetScore: 300,
          bot1: 'rex', bot2: 'rex',
          restrictions: [],
          locked: true,
          tutorial: 'Prove you\'re a STACKED legend. 300 points to win!'
        }
      ]
    },
    {
      id: 6,
      name: 'Champion\'s Arena',
      description: 'The final showdown',
      icon: '👑',
      cssClass: 'adventure-world-6',
      levels: [
        {
          id: '6-1',
          name: 'Arena Entry',
          targetScore: 300,
          bot1: 'rex', bot2: 'rex',
          restrictions: [],
          locked: true,
          tutorial: 'Welcome to the Arena. Only the best survive.'
        },
        {
          id: '6-2',
          name: 'Title Fight',
          targetScore: 350,
          bot1: 'rex', bot2: 'rex',
          restrictions: [],
          locked: true,
          tutorial: 'Almost there. Push for the championship!'
        },
        {
          id: '6-3',
          name: 'Grand Champion',
          targetScore: 400,
          bot1: 'rex', bot2: 'rex',
          restrictions: [],
          locked: true,
          tutorial: 'The ultimate challenge. 400 points. Two Rex bots. Become the Grand Champion!'
        }
      ]
    }
  ],

  getLevel(levelId) {
    for (const world of this.worlds) {
      for (const level of world.levels) {
        if (level.id === levelId) {
          // Build cssClass from per-level restrictions
          let cssClass = '';
          if (level.restrictions.includes('pairsOnly')) {
            cssClass = 'adventure-world-1';
          } else if (level.restrictions.includes('noSum2') && level.restrictions.includes('noSum3')) {
            cssClass = 'adventure-world-2';
          } else if (level.restrictions.includes('noSum3')) {
            cssClass = 'adventure-world-2-partial';
          }

          return {
            ...level,
            worldId: world.id,
            worldName: world.name,
            worldIcon: world.icon,
            cssClass: cssClass
          };
        }
      }
    }
    return null;
  },

  getWorld(worldId) {
    return this.worlds.find(w => w.id === worldId) || null;
  },

  getNextLevel(levelId) {
    const allLevels = this.worlds.flatMap(w =>
      w.levels.filter(l => !l.locked).map(l => l.id)
    );
    const idx = allLevels.indexOf(levelId);
    if (idx === -1 || idx === allLevels.length - 1) return null;
    return allLevels[idx + 1];
  },

  isWorldLocked(worldId) {
    const world = this.getWorld(worldId);
    if (!world) return true;
    return world.levels.every(l => l.locked);
  }
};

window.AdventureLevels = AdventureLevels;
