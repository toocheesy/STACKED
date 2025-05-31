# STACKED! The Card Game 🎴

A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite.

## 🧠 What Is STACKED!?

**STACKED!** is a card game for 2–4 players (currently single-player with 2 AI bots) using a standard 52-card deck. Capture cards from a shared board by matching pairs or adding sums, aiming to score the most points. It blends classic matching with tactical math-based strategy, brought to life as a web app.

## 🎯 Objective

Score the most points by capturing cards using:
- **Pairs**: Match a card from your hand to a board card.
- **Sums**: Add your hand card with board cards to match another board card.

First to reach **500** points (short game) wins!

## 🃏 Setup

1. Use a standard 52-card deck (no Jokers).
2. The app shuffles and deals:
   - 4 cards to each player (you and 2 AI bots).
   - 4 face-up cards to the center board.
3. Play begins with you, followed by the bots in turn order.

## 🔁 Gameplay

On your turn:
1. **Capture Cards**:
   - Use **one hand card** and **at least one board card** to:
     - **Pair**: Match a board card’s value (e.g., play 5 to capture 5).
     - **Sum**: Add your card with board cards to match another (e.g., play 5 + board 5 = 10 to capture 10).
   - You can make **multiple captures** in one turn with the same hand card.
2. **Place a Card**:
   - After capturing (or if no capture is possible), place **1 hand card** on the board.
3. **Empty Board**:
   - If the board is cleared, place 1 hand card on the board until captures are possible or hands are empty.

Bots take their turns automatically, making random captures or placing cards.

## 🛑 End of a Hand

- A hand ends when only one player has cards left.
- If the deck isn’t empty, deal 4 new cards per player (no new board cards unless empty).
- If the board is empty, deal 4 board cards.
- The last player to capture takes any remaining board cards.

## 🪙 Scoring

At the end of each hand:
- Score captured cards:
  - **2–9**: 5 points each
  - **10, J, Q, K**: 10 points each
  - **Ace**: 15 points
- Add to your cumulative score.

## 🏆 Winning

- First to **500 points** (short game) wins!
- If the deck runs out, the highest score wins.
- Break ties with additional hands.
- Click “Restart Game” to play again.

## 💡 Strategy Tips

- Save high-value cards (Aces, Kings) for big captures.
- Place cards strategically to block bots.
- Time your combos to clear the board and gain an edge.

## 🛠️ Getting Started

### Play Online
- Play the game live at [stacked.vercel.app](https://stacked.vercel.app) (update with your Vercel URL once deployed).

### Run Locally
#### Prerequisites
- Node.js (v20+ recommended; v24 may have compatibility issues)
- npm
- Git

#### Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/toocheesy/stacked.git
   cd stacked
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to play.

### Deploy to Vercel
1. Connect your GitHub repo to Vercel:
   - Go to [vercel.com](https://vercel.com), create a new project, and import `toocheesy/stacked`.
2. Configure settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Deploy and access your live game at the provided URL.

## 📂 Project Structure
```
stacked/
├── src/
│   ├── components/     # Card, Board, Hand components
│   ├── styles/         # Tailwind CSS
│   ├── utils/          # Game logic (deck, AI moves)
│   ├── App.jsx         # Main app
│   ├── main.jsx        # React entry
├── public/             # Static assets
├── .gitignore          # Ignore node_modules, dist
├── package.json        # Dependencies
├── vite.config.js      # Vite config
├── tailwind.config.js  # Tailwind config
└── README.md           # This file
```

## 👑 Credits

Created by toocheesy  
Inspired by a timeless family card game  
Developed with AI assistance (Grok by xAI)

## 📄 License

[Creative Commons Attribution-NonCommercial 4.0](https://creativecommons.org/licenses/by-nc/4.0/)  
Play, modify, share—just don’t sell without permission.

## 📬 Feedback

Submit bugs or ideas via [GitHub Issues](https://github.com/toocheesy/stacked/issues).

Let’s get STACKED!