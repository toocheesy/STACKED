/*
 * Adventure Mode - Level Configuration
 * 18 levels across 6 worlds with progressive difficulty
 */

const AdventureLevels = {
  worlds: [
    {
      id: 1,
      name: 'Pair Valley',
      description: 'Learn to match pairs',
      icon: '🌿',
      cssClass: 'adventure-world-1',
      restrictions: ['pairsOnly'],
      levels: [
        {
          id: '1-1',
          name: 'First Match',
          targetScore: 150,
          bot1: 'calvin', bot2: 'calvin',
          tutorial: 'Match pairs to capture cards! Drag a card to the Match area and its pair to capture both.'
        },
        {
          id: '1-2',
          name: 'Pair Master',
          targetScore: 200,
          bot1: 'calvin', bot2: 'calvin',
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
      restrictions: ['noSum2', 'noSum3'],
      levels: [
        {
          id: '2-1',
          name: 'Adding Up',
          targetScore: 150,
          bot1: 'calvin', bot2: 'calvin',
          tutorial: 'New mechanic: Sum captures! Place a base card, then add board cards that equal its value.'
        },
        {
          id: '2-2',
          name: 'Number Crunch',
          targetScore: 200,
          bot1: 'calvin', bot2: 'nina',
          tutorial: 'Aces are worth 1 in sums but 15 points when scored. Capture them!'
        }
      ]
    },
    {
      id: 3,
      name: 'Combo Canyon',
      description: 'Full combo builder unlocked',
      icon: '🏜️',
      cssClass: 'adventure-world-3',
      restrictions: [],
      levels: [
        {
          id: '3-1',
          name: 'Full Power',
          targetScore: 100,
          bot1: 'calvin', bot2: 'nina',
          tutorial: 'All combo areas unlocked! Use Base + Sum1 + Sum2 + Sum3 for massive multi-captures.'
        },
        {
          id: '3-2',
          name: 'Combo Breaker',
          targetScore: 150,
          bot1: 'nina', bot2: 'nina',
          tutorial: 'Try to capture multiple groups in one turn using all the combo areas.'
        },
        {
          id: '3-3',
          name: 'Canyon King',
          targetScore: 200,
          bot1: 'nina', bot2: 'nina',
          tutorial: 'Watch out! Nina is getting smarter. Plan your captures carefully.'
        }
      ]
    },
    {
      id: 4,
      name: 'Strategy Summit',
      description: 'Outsmart tougher bots',
      icon: '🏔️',
      cssClass: 'adventure-world-4',
      restrictions: [],
      levels: [
        {
          id: '4-1',
          name: 'The Climb',
          targetScore: 200,
          bot1: 'nina', bot2: 'nina',
          tutorial: 'Higher scores needed now. Every capture counts!'
        },
        {
          id: '4-2',
          name: 'Rival Match',
          targetScore: 250,
          bot1: 'nina', bot2: 'rex',
          tutorial: 'Rex has entered the game. He reads the board and plays strategically.'
        },
        {
          id: '4-3',
          name: 'Peak Play',
          targetScore: 300,
          bot1: 'nina', bot2: 'rex',
          tutorial: 'Standard STACKED rules. Show them what you\'ve learned!'
        }
      ]
    },
    {
      id: 5,
      name: 'Legend\'s Lair',
      description: 'Face the ultimate challenge',
      icon: '🐉',
      cssClass: 'adventure-world-5',
      restrictions: [],
      levels: [
        {
          id: '5-1',
          name: 'Dragon\'s Gate',
          targetScore: 300,
          bot1: 'rex', bot2: 'nina',
          tutorial: 'Rex leads the pack now. Stay sharp!'
        },
        {
          id: '5-2',
          name: 'Fire Trial',
          targetScore: 350,
          bot1: 'rex', bot2: 'rex',
          tutorial: 'Two Rex bots. This is the real challenge.'
        },
        {
          id: '5-3',
          name: 'Legend Born',
          targetScore: 400,
          bot1: 'rex', bot2: 'rex',
          tutorial: 'Prove you\'re a STACKED legend. 400 points to win!'
        }
      ]
    },
    {
      id: 6,
      name: 'Champion\'s Arena',
      description: 'The final showdown',
      icon: '👑',
      cssClass: 'adventure-world-6',
      restrictions: [],
      levels: [
        {
          id: '6-1',
          name: 'Arena Entry',
          targetScore: 400,
          bot1: 'rex', bot2: 'rex',
          tutorial: 'Welcome to the Arena. Only the best survive.'
        },
        {
          id: '6-2',
          name: 'Title Fight',
          targetScore: 450,
          bot1: 'rex', bot2: 'rex',
          tutorial: 'Almost there. Push for the championship!'
        },
        {
          id: '6-3',
          name: 'Grand Champion',
          targetScore: 500,
          bot1: 'rex', bot2: 'rex',
          tutorial: 'The ultimate challenge. 500 points. Two Rex bots. Become the Grand Champion!'
        }
      ]
    }
  ],

  getLevel(levelId) {
    for (const world of this.worlds) {
      for (const level of world.levels) {
        if (level.id === levelId) {
          return {
            ...level,
            worldId: world.id,
            worldName: world.name,
            worldIcon: world.icon,
            restrictions: world.restrictions,
            cssClass: world.cssClass
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
      w.levels.map(l => l.id)
    );
    const idx = allLevels.indexOf(levelId);
    if (idx === -1 || idx === allLevels.length - 1) return null;
    return allLevels[idx + 1];
  }
};

window.AdventureLevels = AdventureLevels;
