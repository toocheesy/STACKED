# 🎴 STACKED! - Strategic Card Combat Engine

**A revolutionary multi-mode card game featuring intelligent AI, modular architecture, and epic gameplay experiences.**

## 🎯 Game Overview

STACKED! is a strategic card game platform where players compete to capture cards from a shared board using revolutionary multi-area combination mechanics. Choose your battle mode, face intelligent AI opponents, and master the art of strategic card combat!

### 🏆 Core Features

- **🎮 Multi-Mode Platform**: Choose from Classic, Speed, and upcoming Tournament modes
- **🤖 Advanced AI System**: Three difficulty levels with sophisticated capture strategies
- **🎪 Revolutionary 5-Area Combo System**: Interchangeable slots with automatic pair/sum detection
- **🎯 Multi-Area Captures**: Execute complex combos across multiple areas in a single turn
- **📱 Cross-Platform**: Touch and desktop support with intuitive drag-and-drop interface
- **🎨 Dynamic UI**: Beautiful homepage, draggable combo builder, and real-time validation
- **🏅 Professional Presentation**: Animated celebrations, confetti effects, and mode-specific theming

## 🎮 Game Modes

### 🏛️ Classic STACKED
*The original strategic experience*

- **Target Score**: 500 points
- **Unlimited Rounds**: Play until someone reaches the target
- **Multi-Area Captures**: Use all 5 combo areas simultaneously
- **Strategic Depth**: Hints available, complex scoring system
- **Last Combo Takes All**: Final capturer gets remaining board cards

### ⚡ Speed STACKED
*Fast-paced action with time pressure*

- **Time Limit**: 60 seconds per round
- **Target Score**: 300 points (lower for faster games)
- **Speed Bonuses**: More points for quick captures
- **Best of 3**: Shorter match format
- **Time Penalties**: Lose points for cards in hand when time expires

### 🏆 Tournament Mode
*Coming Soon - Elite Competition*

- **Elimination Brackets**: Climb the championship ladder
- **Champion AI**: Face the ultimate challenge
- **Leaderboards**: Track your legendary status
- **Special Rewards**: Unlock achievements and titles

## 🎯 How to Play

### Basic Rules
1. **Setup**: Each player receives 4 cards, 4 cards are placed on the board
2. **Goal**: Be first to reach the target score (varies by mode)
3. **Turns**: Make captures or place a card to end your turn

### Revolutionary Capture System
- **Base Card Area**: The target card for your combo
- **4 Capture Areas**: Sum1, Sum2, Sum3, and Match areas
- **Smart Detection**: Each area automatically detects pair OR sum captures
- **Pair Captures**: Match cards of the same value (works with any card)
- **Sum Captures**: Use number cards (2-10, A) to create mathematical equations
- **Multi-Area Combos**: Combine multiple capture types in a single turn!

### Advanced Strategies
- **Multi-Area Planning**: Set up captures across multiple areas for maximum points
- **Face Card Priority**: Secure J, Q, K matches quickly (can't be used in sums)
- **Board Control**: Strategic placement to limit opponent options
- **Mode Mastery**: Adapt strategies for different game modes

## 🛠️ Technical Architecture

### Modern Modular Design
```
STACKED!/
├── index.html          # Beautiful homepage with mode selection
├── game.html           # Main game interface
├── css/
│   └── styles.css      # Complete styling with animations
├── audio/              # Sound effects (capture, invalid, winner, jackpot)
└── js/
    ├── main.js         # Game controller and event management
    ├── core/
    │   ├── game.js     # GameEngine - Core game logic
    │   ├── utils.js    # Utilities, modals, and sound system
    │   └── modeSelector.js # Mode selection and UI management
    ├── ui.js           # Rendering system and DOM manipulation
    ├── botModal.js     # AI interface for combo interactions
    ├── modes/
    │   ├── classic.js  # Classic STACKED rules and scoring
    │   └── speed.js    # Speed mode with timer and bonuses
    ├── ai.js           # Bot intelligence system
    ├── deck.js         # Card creation and shuffling
    └── gameLogic.js    # Capture validation and scoring
```

### Core Systems

**🎮 GameEngine**: Handles game state, validation, and mode coordination  
**🎨 UISystem**: Pure rendering system that works with any mode  
**🤖 BotModalInterface**: AI that interacts through the same UI as humans  
**🎯 ModeSelector**: Beautiful mode selection with dynamic settings  
**⚙️ InterchangeableSlots**: Revolutionary validation supporting pairs and sums in any area

### AI Intelligence Levels
- **Beginner**: 80% random placement, 20% simple captures - perfect for learning
- **Intermediate**: 50/50 strategic balance with random capture selection
- **Legendary**: Optimal play with best capture prioritization and strategic placement

## 🚀 Installation & Setup

### Quick Start
1. **Download** all files maintaining the folder structure
2. **Open `index.html`** in any modern browser
3. **Choose your mode** on the beautiful homepage
4. **Configure settings** and begin your legendary journey!

### Browser Compatibility
- **Chrome/Edge**: Full support with all features ✅
- **Firefox**: Full support with all features ✅  
- **Safari**: Full support with all features ✅
- **Mobile**: Responsive design with touch controls ✅

## 🎯 Scoring System

### Point Values
- **Aces**: 15 points each (highest value)
- **Face Cards (10, J, Q, K)**: 10 points each
- **Number Cards (2-9)**: 5 points each

### Special Bonuses
- **Speed Mode**: Time bonuses for quick captures
- **Multi-Area Captures**: Bonus points for complex combos
- **Last Combo Takes All**: Final capturer gets all remaining board cards

## 🎮 Adding New Game Modes

The modular architecture makes adding new modes incredibly easy:

```javascript
const NewMode = {
  name: "New Mode Name",
  description: "Mode description for homepage",
  config: { 
    targetScore: 400,
    timeLimit: null,
    specialRules: true 
  },
  
  init(gameEngine) {
    // Mode initialization
  },
  
  calculateScore(cards) {
    // Custom scoring logic
  },
  
  checkEndCondition(gameEngine) {
    // Win/lose conditions
  },
  
  getSettings() {
    // Dynamic settings for mode selector
  }
};

// Register the mode
modeSelector.registerMode('newmode', NewMode);
```

## 🏆 Advanced Features

### Professional UI/UX
- **Homepage**: Animated mode cards with particle effects
- **Draggable Modals**: Move combo builder anywhere on screen
- **Real-time Validation**: Instant visual feedback with green glow
- **Smart Messages**: Contextual hints and error detection
- **Cross-platform Events**: Unified touch and mouse interaction

### Performance Optimizations
- **Efficient State Management**: Complex game state handled smoothly
- **Optimized Rendering**: Dynamic layout with memory management
- **ID-based Card Tracking**: Prevents memory leaks and state corruption
- **Preloaded Audio**: Instant sound effects for better experience

## 🎪 Technical Achievements

### Innovation Highlights
- **First Card Game** with truly interchangeable capture mechanics
- **Advanced Bot AI** using the same interface as human players
- **Real-time Multi-Area Validation** across simultaneous capture zones
- **Dynamic Mode System** with hot-swappable game rules
- **Professional Game Engine** architecture rivaling commercial games

### Development Milestones
- **Modular Restructure**: Transformed 1500+ line monolith into clean architecture
- **Multi-Mode Platform**: Seamless mode switching with persistent settings
- **Advanced AI**: Three-tier intelligence system with capture optimization
- **Cross-Platform Support**: Touch, mouse, and keyboard unified system

## 🎉 Credits & Recognition

**Game Design**: Revolutionary 5-area capture system with interchangeable mechanics  
**AI Development**: Sophisticated bot intelligence with three distinct personality levels  
**Technical Architecture**: Professional JavaScript game engine with modular expansion  
**UI/UX Design**: Beautiful animations, responsive design, and accessibility features  
**Audio Integration**: Professional sound system with mode-specific audio cues

---

## 🚀 Ready to Master Strategic Card Combat?

**STACKED!** represents the pinnacle of browser-based card game development. With its innovative capture mechanics, intelligent AI opponents, beautiful presentation, and infinitely expandable architecture, it delivers an experience that rivals commercial card game platforms.

### 🎯 Quick Links
- **Play Classic Mode**: Traditional strategic gameplay
- **Try Speed Mode**: Fast-paced action with time pressure  
- **Explore Legendary AI**: Challenge the ultimate opponents
- **Create Custom Modes**: Extend the platform with your own rules

**Start your journey to becoming a STACKED! legend today!** 🎴✨

### 🏆 Achievement System (Coming Soon)
- **First Capture**: Complete your first successful combo
- **Speed Demon**: Win a Speed Mode game with 30+ seconds remaining
- **Combo Master**: Execute a 4-area capture in a single turn
- **AI Vanquisher**: Defeat Legendary difficulty bots
- **Mode Explorer**: Play all available game modes
- **Tournament Champion**: Win your first elimination bracket

---


*Built with passion for strategic gaming and technical excellence. STACKED! - Where every card tells a story, and every capture writes legend.* 🎮⚡