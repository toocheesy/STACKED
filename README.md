# STACKED! The Card Game 🎴

A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite. **Currently in active development - core gameplay working!**

## 🧠 What Is STACKED!?

STACKED! is a digital recreation of a lost family card game, brought back to life for the first time ever. Originally played by families for generations, this version captures the strategic depth of matching pairs and building sums in a fast-paced web experience.

**Game Features:**
- Single-player vs 2 AI bots
- Dual play area system for strategic combo building
- Adjustable difficulty and scoring targets
- Responsive web design for desktop and mobile

## 🎯 Objective

Be the first to reach the target score (default 500 points, adjustable in settings) by capturing cards from the board using strategic combinations of pairs and sums.

## 🃏 How to Play

### Setup
- Each player (you + 2 AI bots) gets 4 cards
- 4 cards are placed face-up on the board
- Player goes first, followed by bots

### Your Turn
1. **Build Combos** - Drag cards to the dual play areas:
   - **Play Area**: Place cards that will sum together
   - **Principal Match**: Place your target card
   
2. **Valid Captures**:
   - **Pair Capture**: Match identical values (5♥ captures 5♠)
   - **Sum Capture**: Use multiple cards that sum to your target (3+2 captures 5)
   - Must use at least one hand card AND one board card

3. **Submit**: Click "Submit Move" when areas glow green

4. **End Turn**: Place a card on the board to finish your turn

### Scoring
- **2-9**: 5 points each
- **10, J, Q, K**: 10 points each  
- **Ace**: 15 points each

### Winning
Game ends when deck is empty. Highest score wins, or first to reach target score!

## 🛠️ Current Status

**✅ Working Features:**
- Settings modal with customizable options
- Card dealing and hand management
- Drag & drop card interaction
- Dual play area combo system
- Pair and sum capture validation
- Player turn mechanics
- AI bot opponents (3 difficulty levels)
- Score tracking and display
- Game restart functionality

**🚧 Known Issues:**
- Drag & drop positioning could be smoother
- End-game flow needs refinement
- Bot AI strategy could be enhanced

**📋 Development Notes:**
- Built with vanilla HTML/CSS/JavaScript
- Simple 4-file architecture for reliability
- No external dependencies or frameworks
- Deployed via Vercel with GitHub integration

## 🎮 Play Online

**Live Demo**: [https://stacked-orcin.vercel.app](https://stacked-orcin.vercel.app)

*Settings modal appears on load - configure your game and click "Start Game" to begin!*

## 🏗️ For Developers

### File Structure
```
STACKED/
├── css/
│   └── styles.css      # All game styling
├── js/
│   ├── ai.js          # Bot logic and difficulty levels
│   ├── deck.js        # Card creation and dealing
│   ├── gameLogic.js   # Capture validation and scoring
│   └── main.js        # Core game engine and rendering
├── index.html         # Main game interface
└── README.md         # This file
```

### Local Development
1. Clone the repository
2. Open `index.html` in any modern browser
3. No build process or dependencies required!

### Deployment
Uses GitHub → Vercel auto-deployment:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

## 🎯 The Story

This game is a digital recreation of "Points" - a card game passed down through family generations that had no official rules or digital version. Through careful research and memory reconstruction, STACKED! brings this lost game back to life for new generations to discover and enjoy.

## 🏆 Credits

- **Created by**: toocheesy
- **Inspired by**: A cherished family card game tradition
- **Development**: Built with AI assistance for rapid prototyping
- **Special Thanks**: To Grandma, who taught us this game originally

## 📄 License

Creative Commons Attribution-NonCommercial 4.0 - Play, modify, share (just don't sell without permission)

---

*Join us in preserving gaming history - one card at a time!* 🎴✨