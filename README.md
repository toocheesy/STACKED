# STACKED! The Card Game 🎴

A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite. **Audio system integrated - game is 98% complete!**

## 🧠 What Is STACKED!?

STACKED! is a digital recreation of a lost family card game, brought back to life for the first time ever. Originally played by families for generations, this version captures the strategic depth of matching pairs and building sums in a revolutionary **5-area multi-capture system**.

**Game Features:**
- Single-player vs 2 AI bots with 3 difficulty levels
- **Revolutionary 5-area combo system** - make multiple captures simultaneously
- **Multi-area validation** - combine sum captures with pair captures in one turn
- **Complete audio system** - Sound effects for captures, invalid moves, wins, and jackpots
- Adjustable difficulty and scoring targets (100-1500 points)
- Responsive web design for desktop and mobile
- Real-time visual feedback with glowing valid combinations
- **Last Combo Takes All** endgame rule for dramatic finishes

## 🎯 Objective

Be the first to reach the target score (default 500 points, adjustable in settings) by capturing cards from the board using strategic combinations of pairs and sums across multiple play areas.

## 🃏 How to Play

### Setup
- Each player (you + 2 AI bots) gets 4 cards
- 4 cards are placed face-up on the board
- Player goes first, followed by bots

### Your Turn - NEW 5-AREA SYSTEM
1. **Build Multi-Captures** - Drag cards to the 5 specialized areas:
   - **Base Card Area**: Your target/principal card (required)
   - **Sum Area 1**: Cards that add up to base card value
   - **Sum Area 2**: Additional sum combination
   - **Sum Area 3**: Third sum combination  
   - **Match Area**: Cards matching base card value
   
2. **Valid Multi-Captures**:
   - **Multiple Sum Captures**: Use Sum1 + Sum2 + Sum3 simultaneously (e.g., 3+2, 4+1, all targeting 5)
   - **Mixed Captures**: Combine sum areas with match area (e.g., 3+2=5 AND 5♠+5♣ matching)
   - **Pair Captures**: Multiple matching cards in match area
   - Must use at least one hand card AND one board card per capture type

3. **Submit**: Click "Submit Move" when areas glow green - captures ALL valid areas at once

4. **End Turn**: Place a card on the board to finish your turn

### Advanced Strategy
- **Multi-area planning**: Set up combinations across multiple areas for massive point captures
- **Resource management**: Balance immediate captures vs setting up larger future combinations
- **Endgame positioning**: Save powerful cards for the "Last Combo Takes All" finale

### Scoring
- **2-9**: 5 points each
- **10, J, Q, K**: 10 points each  
- **Ace**: 15 points each
- **Multi-capture bonus**: Score all captured cards simultaneously

### Winning
Game ends when deck is empty. **Last Combo Takes All** rule: whoever made the final capture gets all remaining board cards as a bonus!

## 🎵 Audio System

**Complete sound design** enhances gameplay:
- **Capture Sound**: Plays when successfully capturing cards
- **Invalid Sound**: Alerts for invalid moves or combinations
- **Winner Sound**: Celebrates game victories
- **Jackpot Sound**: Special "Last Combo Takes All" moments
- **Settings Control**: Toggle sound effects on/off in game settings

## 🛠️ Current Status

**✅ MAJOR FEATURES COMPLETE:**
- **5-area multi-capture system** - Revolutionary gameplay mechanic ✅
- **Smart validation engine** - Validates sum, pair, and mixed captures ✅
- **Multi-difficulty AI system** - Beginner (random), Intermediate (mixed), Legendary (optimal) ✅
- **Complete audio system** - All 4 sound effects integrated and functional ✅
- **Last Combo Takes All rule** - Endgame bonus mechanic implemented ✅
- **Robust endgame handling** - Last player logic, proper game termination ✅
- **Visual feedback system** - Green glow for valid combinations ✅
- **Drag & drop interaction** - Smooth card movement with touch support ✅
- **Settings system** - Configurable speed, sound, score targets, difficulty ✅
- **Score tracking** - Real-time point calculation and display ✅
- **Turn management** - Perfect player → bot1 → bot2 → player flow ✅

**✅ TECHNICAL ARCHITECTURE:**
- **5-area state management** - `{ base: [], sum1: [], sum2: [], sum3: [], match: [] }`
- **Modular validation** - Separate validation for each capture type
- **Audio integration** - 4-file sound system with settings control
- **Bot AI integration** - Updated for multi-area system
- **Responsive design** - Works on desktop and mobile
- **Clean codebase** - Well-organized JavaScript with proper separation

**🚧 FINAL POLISH (1% remaining):**
- Minor bug fixes and validation edge cases
- Performance optimization and visual enhancements
- Enhanced bot strategy for multi-area combinations

**📋 Recent Major Updates:**
- **Audio System Integration** - Complete 4-sound effect system
- **Bug Fixes** - Resolved syntax errors and sound mapping issues
- **Last Combo Takes All** - Dramatic endgame rule implementation
- **Enhanced Validation** - Improved multi-capture validation logic
- **Settings Integration** - Sound control and game configuration

## 🎮 Play Online

**Live Demo**: [https://stacked-orcin.vercel.app](https://stacked-orcin.vercel.app)

*Settings modal appears on load - configure your game and click "Start Game" to begin! Don't forget to enable sound effects for the full experience.*

## 🏗️ For Developers

### File Structure
```
STACKED/
├── audio/
│   ├── capture.mp3    # Successful capture sound
│   ├── invalid.mp3    # Invalid move alert
│   ├── winner.mp3     # Victory celebration
│   └── jackpot.mp3    # Last Combo Takes All bonus
├── css/
│   └── styles.css     # All game styling + 5-area layout
├── js/
│   ├── ai.js          # Bot logic for 5-area system
│   ├── deck.js        # Card creation and dealing
│   ├── gameLogic.js   # Multi-capture validation and scoring
│   └── main.js        # Core game engine (1000+ lines)
├── index.html         # 5-area game interface  
└── README.md         # This file
```

### Architecture Notes
- **State Management**: New 5-area combination object
- **Audio System**: 4-file MP3 system with settings integration
- **Validation System**: Supports multiple simultaneous capture types
- **Render Engine**: Modular rendering with helper functions
- **AI Integration**: Compatible with original AI logic
- **No Framework Dependencies**: Pure JavaScript implementation

### Local Development
1. Clone the repository
2. Open `index.html` in any modern browser
3. No build process or dependencies required!
4. Audio files must be served from a web server (not file://) for full functionality

### Deployment
Uses GitHub → Vercel auto-deployment:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

## 🎯 The Story

This game is a digital recreation of "Points" - a card game passed down through family generations that had no official rules or digital version. Through careful research, memory reconstruction, and innovative game design, STACKED! brings this lost game back to life with modern enhancements that honor the original while expanding strategic possibilities.

The addition of the 5-area multi-capture system and complete audio integration represents months of development and testing, creating a gaming experience that exceeds the original while maintaining its strategic heart.

## 🏆 Credits

- **Created by**: toocheesy
- **Inspired by**: A cherished family card game tradition  
- **Development**: Built with AI assistance for rapid prototyping and architecture design
- **Audio**: Custom sound effects for enhanced gameplay experience
- **Special Thanks**: To Grandma, who taught us this game originally

## 📄 License

Creative Commons Attribution-NonCommercial 4.0 - Play, modify, share (just don't sell without permission)

---

*Join us in preserving gaming history - one revolutionary card game at a time!* 🎴✨🎵