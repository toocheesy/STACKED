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
- **🧠 Intelligent Hint System**: Smart suggestions powered by Card Intelligence
- **🎓 Educational Mode**: Combo assistance and step-by-step guidance for beginners

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
    │   ├── modeSelector.js # Mode selection and UI management
    │   └── MessageController.js # Smart message system with combo assistance
    ├── ui.js           # Rendering system and DOM manipulation
    ├── botModal.js     # AI interface for combo interactions
    ├── modes/
    │   ├── classic.js  # Classic STACKED rules and scoring
    │   └── speed.js    # Speed mode with timer and bonuses
    ├── ai.js           # Bot intelligence system
    ├── deck.js         # Card creation and shuffling
    ├── gameLogic.js    # Capture validation and scoring
    └── cardIntelligence.js # Advanced AI brain for strategic decisions
```

### Core Systems

**🎮 GameEngine**: Handles game state, validation, and mode coordination  
**🎨 UISystem**: Pure rendering system that works with any mode  
**🤖 BotModalInterface**: AI that interacts through the same UI as humans  
**🎯 ModeSelector**: Beautiful mode selection with dynamic settings  
**⚙️ InterchangeableSlots**: Revolutionary validation supporting pairs and sums in any area  
**🧠 CardIntelligence**: Advanced AI brain for strategic gameplay and hints  
**🎓 MessageController**: Smart combo assistance and educational guidance  

### Script Loading Order
**CRITICAL: Scripts must load in this exact order in game.html:**

```html
<!-- Core Dependencies -->
<script src="js/deck.js"></script>
<script src="js/gameLogic.js"></script>
<script src="js/cardIntelligence.js"></script>

<!-- Core Systems -->
<script src="js/core/game.js"></script>
<script src="js/core/utils.js"></script>
<script src="js/core/modeSelector.js"></script>
<script src="js/core/MessageController.js"></script>

<!-- Game Modes -->
<script src="js/modes/classic.js"></script>
<script src="js/modes/speed.js"></script>

<!-- AI Systems -->
<script src="js/ai.js"></script>
<script src="js/botModal.js"></script>

<!-- UI System -->
<script src="js/ui.js"></script>

<!-- Main Controller (MUST BE LAST!) -->
<script src="js/main.js"></script>
```

### AI Intelligence Levels
- **Beginner**: 100% capture awareness, 60% capture rate - smart but still makes beginner mistakes
- **Intermediate**: Mixed personality strategic AI with balanced risk assessment
- **Legendary**: Adaptive optimal play with context-based capture prioritization and strategic placement

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
- **Draggable Modals**: Move combo builder anywhere on screen (powered by DraggableModal in utils.js)
- **Real-time Validation**: Instant visual feedback with green glow
- **Smart Messages**: Contextual hints and error detection via MessageController
- **Cross-platform Events**: Unified touch and mouse interaction
- **Responsive Board Layout**: Dynamic card grid that adapts to any card count

### Intelligence Systems
- **Card Intelligence**: Advanced AI brain that tracks cards, calculates risks, and makes strategic decisions
- **Hint System**: Powered by Card Intelligence to provide smart, contextual suggestions
- **Educational Mode**: Auto-enabled for beginner difficulty with step-by-step combo guidance
- **Bot Personalities**: Different AI personalities (calculator, strategist, adaptive) based on difficulty

### Performance Optimizations
- **Efficient State Management**: Complex game state handled smoothly
- **Optimized Rendering**: Dynamic layout with memory management
- **ID-based Card Tracking**: Prevents memory leaks and state corruption
- **Preloaded Audio**: Instant sound effects for better experience
- **Centralized Bot Turn Management**: Bulletproof turn scheduling without deadlocks

## 🎪 Technical Achievements

### Innovation Highlights
- **First Card Game** with truly interchangeable capture mechanics
- **Advanced Bot AI** using the same interface as human players
- **Real-time Multi-Area Validation** across simultaneous capture zones
- **Dynamic Mode System** with hot-swappable game rules
- **Professional Game Engine** architecture rivaling commercial games
- **Revolutionary Hint System** powered by AI card intelligence
- **Educational Combo Assistant** for seamless learning experience
- **Responsive Board System** that handles any number of cards elegantly

### Development Milestones
- **Modular Restructure**: Transformed 1500+ line monolith into clean architecture
- **Multi-Mode Platform**: Seamless mode switching with persistent settings
- **Advanced AI**: Three-tier intelligence system with capture optimization
- **Cross-Platform Support**: Touch, mouse, and keyboard unified system
- **Card Intelligence System**: AI brain for strategic gameplay and hints
- **Message Controller**: Smart assistance and educational guidance
- **Board Layout Fix**: Dynamic grid system preventing card overflow
- **Bot Turn Management**: Centralized scheduling eliminating deadlocks
- **Bot Strategy Optimization**: Aggressive capture behavior with smart turn ending

## 🚨 Recent Critical Fixes (Latest Update)

### ✅ **TICKET #13: Card Disappearing Bug (CRITICAL) - FIXED!**
- **Problem**: Player cards randomly disappearing during bot turns
- **Solution**: Added proper safety checks and bot turn blocking in drag/drop handlers
- **Result**: Bulletproof card tracking, no more disappearing cards

### ✅ **TICKET #11: Hint System Rebuild (HIGH) - FIXED!**
- **Problem**: Hint button provided no helpful feedback
- **Solution**: LEGENDARY HintSystem class with Card Intelligence integration
- **Result**: Smart suggestions with glow effects and popup guidance

### ✅ **TICKET #14: Board Card Overflow (HIGH) - FIXED!**
- **Problem**: Cards spilling outside wooden border on board
- **Solution**: Dynamic CSS grid with `repeat(auto-fit, minmax(50px, 54px))`
- **Result**: All cards properly contained within game area, responsive scaling

### ✅ **TICKET #15: Bot Strategy Investigation (MEDIUM) - FIXED!**
- **Problem**: Bots artificially holding back cards instead of capturing aggressively
- **Solution**: Optimized bot behavior for maximum capture efficiency with smart turn ending
- **Result**: Bots now play optimally aggressive while maintaining proper game flow

### 🔧 Additional Technical Improvements
- **Pure UI Simulator**: `botModal.js` now only handles visual actions, reports results
- **Centralized Control**: All turn logic consolidated in `main.js` with proper guards
- **Better Error Recovery**: Fallback systems for bot action failures
- **Enhanced Logging**: Detailed console output for debugging bot behavior

## 🎯 Active Features

### ✅ **LEGENDARY HINT SYSTEM**: AI-powered suggestions with Card Intelligence
### ✅ **Educational Mode**: Step-by-step combo guidance for beginners
### ✅ **Draggable Combo Builder**: Move combo areas anywhere on screen
### ✅ **Multi-Area Captures**: Complex combos across all 5 areas simultaneously
### ✅ **Smart Message System**: Contextual feedback and guidance
### ✅ **Responsive Board Layout**: Dynamic grid handling any card count
### ✅ **Bulletproof Bot AI**: Centralized turn management with error recovery
### ✅ **Optimized Bot Strategy**: Aggressive capture behavior with intelligent personalities

### 🔧 Remaining Enhancement Queue
- **TICKET #6: Mode Display Enhancement (MEDIUM)** - Real-time game info during play
- **TICKET #8: Combo Text Cleanup (LOW)** - Polish combo builder text and styling
- **TICKET #9: Logo Creation (LOW)** - Professional branding and visual identity
- **TICKET #10: User Login System (FUTURE MAJOR)** - User persistence and progression

### 🔮 Future Major Features
- **Tournament Mode**: Elite competition with elimination brackets
- **Achievement System**: Unlock titles and rewards
- **Advanced Statistics**: Detailed performance tracking
- **Custom Themes**: Personalized visual experiences

## 🎉 Credits & Recognition

**Game Design**: Revolutionary 5-area capture system with interchangeable mechanics  
**AI Development**: Sophisticated bot intelligence with Card Intelligence system  
**Technical Architecture**: Professional JavaScript game engine with modular expansion  
**UI/UX Design**: Beautiful animations, responsive design, and accessibility features  
**Audio Integration**: Professional sound system with mode-specific audio cues  
**Educational Systems**: Combo assistance and intelligent tutoring integration  
**Performance Engineering**: Optimized board layout and bulletproof bot turn management  
**Strategic AI**: Advanced bot personalities with aggressive capture optimization

---

## 🚀 Ready to Master Strategic Card Combat?

**STACKED!** represents the pinnacle of browser-based card game development. With its innovative capture mechanics, intelligent AI opponents, beautiful presentation, responsive board layout, and infinitely expandable architecture, it delivers an experience that rivals commercial card game platforms.

### 🎯 Quick Links
- **Play Classic Mode**: Traditional strategic gameplay with AI hints
- **Try Speed Mode**: Fast-paced action with time pressure  
- **Explore Legendary AI**: Challenge the ultimate opponents powered by Card Intelligence
- **Learn with Educational Mode**: Master combos with step-by-step guidance
- **Create Custom Modes**: Extend the platform with your own rules

**Start your journey to becoming a STACKED! legend today!** 🎴✨

### 🏆 Achievement System (Coming Soon)
- **First Capture**: Complete your first successful combo
- **Speed Demon**: Win a Speed Mode game with 30+ seconds remaining
- **Combo Master**: Execute a 4-area capture in a single turn
- **AI Vanquisher**: Defeat Legendary difficulty bots
- **Mode Explorer**: Play all available game modes
- **Tournament Champion**: Win your first elimination bracket
- **Hint Master**: Use the hint system to discover advanced combos
- **Educational Graduate**: Complete tutorial mode with perfect scores
- **Bug Hunter**: Experience the game without any crashes (Achievement Unlocked!)
- **Strategy Master**: Witness the new aggressive bot AI in action

---

*Built with passion for strategic gaming and technical excellence. STACKED! - Where every card tells a story, every capture writes legend, every combo is powered by intelligence, and every bug gets squashed with legendary precision.* 🎮⚡