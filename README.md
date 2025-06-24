# 🎴 STACKED! - Strategic Card Capture Game

**A sophisticated 3-player card game featuring advanced AI, multi-area captures, and dynamic scoring.**

## 🎯 Game Overview

STACKED! is a strategic card game where players compete to capture cards from a shared board using complex combination mechanics. Battle against intelligent bots across multiple rounds to reach the target score first!

### 🏆 Key Features

- **🤖 Advanced AI System**: Three difficulty levels (Beginner, Intermediate, Legendary) with sophisticated capture strategies
- **🎪 Revolutionary 5-Area Combo System**: Interchangeable slots that automatically detect pair or sum captures
- **🎯 Multi-Area Captures**: Execute complex combos across multiple areas in a single turn
- **📱 Cross-Platform**: Touch and desktop support with intuitive drag-and-drop interface
- **🎨 Dynamic UI**: Draggable combo builder with real-time validation and visual feedback
- **🏅 Professional Scoreboard**: Animated round-end celebrations with confetti effects

## 🎮 How to Play

### Basic Rules
1. **Setup**: Each player receives 4 cards, 4 cards are placed on the board
2. **Goal**: Be first to reach the target score (default: 500 points)
3. **Turns**: Make captures or place a card to end your turn

### Capture Mechanics
- **Pair Captures**: Match cards of the same value (works with any card)
- **Sum Captures**: Use number cards to create mathematical equations (2-10 and Aces only)
- **Multi-Area Combos**: Combine multiple capture types in a single turn

### The Revolutionary 5-Area System
- **Base Card Area**: The target card for your combo
- **Sum Areas 1-3**: Cards that add up to the base card value
- **Match Area**: Cards that pair with the base card value
- **Smart Detection**: Any area automatically detects whether you're making a pair or sum!

### Scoring
- **Number Cards (2-9)**: 5 points each
- **Face Cards (10, J, Q, K)**: 10 points each  
- **Aces**: 15 points each
- **Last Combo Takes All**: Final capturer in a round gets all remaining board cards

## 🚀 Technical Architecture

### Core Systems
- **SmartMessageSystem**: Contextual user feedback and error detection
- **DraggableModal**: Movable combo builder with viewport boundary detection
- **BotModalInterface**: AI system that interacts through the same UI as humans
- **InterchangeableSlots**: Revolutionary validation system supporting both pairs and sums in any area

### AI Intelligence
- **Beginner**: 80% random placement, 20% simple captures
- **Intermediate**: 50/50 strategy with random capture selection
- **Legendary**: Optimal play with best capture prioritization and strategic card placement

### Game Engine Features
- **Dynamic Board Layout**: Grid system that expands as board fills
- **Real-time Validation**: Instant visual feedback with green glow for valid combos
- **State Management**: Complex game state with combination tracking and turn flow
- **Cross-platform Events**: Touch, mouse, and keyboard support

## 🛠️ Installation & Setup

### Files Structure
```
STACKED!/
├── index.html          # Main game interface
├── css/
│   └── styles.css      # Complete styling with modal system
└── js/
    ├── main.js         # Core game engine (1500+ lines)
    ├── gameLogic.js    # Scoring and capture validation
    ├── ai.js           # Bot intelligence system
    └── deck.js         # Card creation and shuffling
```

### Quick Start
1. Clone or download all files
2. Ensure folder structure matches above
3. Open `index.html` in any modern browser
4. Click "Start Game" and begin playing!

### Browser Compatibility
- **Chrome/Edge**: Full support with all features
- **Firefox**: Full support with all features
- **Safari**: Full support with all features
- **Mobile**: Responsive design with touch controls

## 🎯 Game Modes & Settings

### Difficulty Levels
- **Beginner**: Perfect for learning the mechanics
- **Intermediate**: Balanced challenge with strategic elements
- **Legendary**: Advanced AI that will test your skills

### Customizable Options
- **Target Score**: 100-1500 points
- **Card Speed**: Animation timing preferences
- **Sound Effects**: Audio feedback toggle
- **Bot Difficulty**: Per-game AI challenge level

## 🏆 Advanced Strategies

### Combo Mastery
- **Multi-Area Planning**: Set up captures across multiple areas for maximum points
- **Face Card Priority**: Secure J, Q, K matches quickly (can't be used in sums)
- **Board Control**: Strategic placement to limit opponent options
- **End Game Timing**: Control "Last Combo Takes All" opportunities

### AI Exploitation
- **Beginner Bots**: Take advantage of random placements
- **Intermediate Bots**: Predict 50/50 behavior patterns
- **Legendary Bots**: Force suboptimal plays through board positioning

## 🎪 Technical Achievements

### Innovation Highlights
- **First Card Game** with truly interchangeable capture mechanics
- **Advanced Bot AI** that uses the same interface as human players
- **Real-time Validation** across multiple simultaneous capture areas
- **Dynamic Difficulty Scaling** with sophisticated behavioral patterns
- **Professional UI/UX** with draggable modals and visual feedback

### Performance Features
- **Efficient State Management**: Complex game state handled smoothly
- **Optimized Rendering**: 500+ line render engine with dynamic layout
- **Memory Management**: ID-based card tracking prevents memory leaks
- **Cross-Platform Events**: Unified touch and mouse interaction system

## 🎉 Credits & Development

**Game Design**: Revolutionary 5-area capture system with interchangeable slot mechanics
**AI Development**: Sophisticated bot intelligence with three distinct difficulty levels  
**Technical Architecture**: Advanced JavaScript game engine with professional UI/UX
**Testing**: Extensive gameplay balancing and bug resolution

---

### 🚀 Ready to Master the Art of Strategic Card Capture?

**STACKED!** represents the pinnacle of browser-based card game development. With its innovative capture mechanics, intelligent AI opponents, and professional presentation, it delivers an experience that rivals commercial card games.

**Start your journey to becoming a STACKED! legend today!** 🎴✨