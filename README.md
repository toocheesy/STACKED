# STACKED! The Card Game 🎴

A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite. **Complete game - ready to play!**

## 🧠 What Is STACKED!?

STACKED! is a digital recreation of a lost family card game, brought back to life for the first time ever. Originally played by families for generations, this version captures the strategic depth of matching pairs and building sums in a revolutionary **5-area multi-capture system** with **smart contextual messaging** and **draggable interface**.

**Game Features:**
- Single-player vs 2 AI bots with 3 difficulty levels
- **Revolutionary 5-area combo system** - make multiple captures simultaneously
- **Draggable modal combo builder** - position anywhere on screen for optimal gameplay
- **Smart contextual messaging** - intelligent error detection and helpful feedback
- **Multi-area validation** - combine sum captures with pair captures in one turn
- **Complete audio system** - Sound effects for captures, invalid moves, wins, and jackpots
- **Responsive flexbox layout** - perfectly fits any screen without scrolling
- Adjustable difficulty and scoring targets (100-1500 points)
- Real-time visual feedback with glowing valid combinations
- **Last Combo Takes All** endgame rule for dramatic finishes

## 🎯 Objective

Be the first to reach the target score (default 500 points, adjustable in settings) by capturing cards from the board using strategic combinations of pairs and sums across multiple play areas.

## 🃏 How to Play

### Setup
- Each player (you + 2 AI bots) gets 4 cards
- 4 cards are placed face-up on the board
- Player goes first, followed by bots

### Your Turn - 5-AREA SYSTEM
1. **Build Multi-Captures** - Drag cards to the movable combo builder:
   - **Base Card Area**: Your target/principal card (single card only)
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
- **Draggable interface**: Move the combo builder anywhere for perfect visibility
- **Multi-area planning**: Set up combinations across multiple areas for massive point captures
- **Smart feedback**: Real-time error detection helps you learn optimal plays
- **Resource management**: Balance immediate captures vs setting up larger future combinations
- **Endgame positioning**: Save powerful cards for the "Last Combo Takes All" finale

### Scoring
- **2-9**: 5 points each
- **10, J, Q, K**: 10 points each  
- **Ace**: 15 points each
- **Multi-capture bonus**: Score all captured cards simultaneously

### Winning
Game ends when deck is empty and someone reaches the target score. **Last Combo Takes All** rule: whoever made the final capture gets all remaining board cards as a bonus!

## 🎵 Audio System

**Complete sound design** enhances gameplay:
- **Capture Sound**: Plays when successfully capturing cards
- **Invalid Sound**: Alerts for invalid moves or combinations with smart error messages
- **Winner Sound**: Celebrates game victories
- **Jackpot Sound**: Special "Last Combo Takes All" moments
- **Settings Control**: Toggle sound effects on/off in game settings

## 🎮 Play Online

**Live Demo**: [https://stacked-orcin.vercel.app](https://stacked-orcin.vercel.app)

*Settings modal appears on load - configure your game and click "Start Game" to begin! Don't forget to enable sound effects for the full experience.*

## 🆕 Latest Updates

### Smart User Experience
- **Contextual messaging system** - Messages adapt based on game state
- **Intelligent error detection** - Specific feedback for different invalid moves
- **Auto-clearing notifications** - Success/error messages with visual styling
- **Draggable combo builder** - Position the interface anywhere on screen
- **Responsive layout** - No more scrolling issues, perfect fit on any screen

### Enhanced Interface
- **Professional modal design** - Black background with gold borders
- **Visual feedback system** - Green glow for valid combos, red for errors
- **Point display in captures** - See exactly how many points you earned
- **Reset area feedback** - Clear confirmation when clearing play areas
- **Favicon support** - Browser tab icon for professional appearance

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
│   └── styles.css     # Responsive flexbox layout + draggable modal
├── js/
│   ├── ai.js          # Bot logic for 5-area system
│   ├── deck.js        # Card creation and dealing
│   ├── gameLogic.js   # Multi-capture validation and scoring
│   └── main.js        # Core engine + Smart messaging + Draggable system
├── index.html         # Modern responsive interface  
└── README.md         # This file
```

### Architecture Notes
- **State Management**: 5-area combination object for complex captures
- **Smart Messaging System**: Context-aware feedback with error detection
- **Audio System**: 4-file MP3 system with settings integration
- **Draggable Interface**: Professional modal with viewport boundary detection
- **Validation System**: Supports multiple simultaneous capture types
- **Responsive Design**: Flexbox-based layout that adapts to any screen
- **Render Engine**: Modular rendering with helper functions
- **AI Integration**: Smart bots with difficulty scaling
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

The addition of the 5-area multi-capture system, smart contextual messaging, draggable interface, and complete audio integration represents months of development and testing, creating a gaming experience that exceeds the original while maintaining its strategic heart.

## 🏆 Credits

- **Created by**: toocheesy
- **Inspired by**: A cherished family card game tradition  
- **Development**: Built with AI assistance for rapid prototyping and architecture design
- **UX Design**: Smart contextual messaging and draggable interface for modern gameplay
- **Audio**: Custom sound effects for enhanced gameplay experience
- **Special Thanks**: To Grandma, who taught us this game originally

## 📄 License

Creative Commons Attribution-NonCommercial 4.0 - Play, modify, share (just don't sell without permission)

---

*Join us in preserving gaming history - one revolutionary card game at a time!* 🎴✨🎵