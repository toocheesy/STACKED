STACKED! The Card Game 🎴
A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite.
🧠 What Is STACKED!?
STACKED! is a card game for 2–4 players (currently single-player with 2 AI bots) using a standard 52-card deck. Capture cards from a shared board by matching pairs or building sums across dual play areas, aiming to score the most points. It blends classic matching with tactical math-based strategy, brought to life as a web app.
🎯 Objective
Be the first to reach the target score (default 500 points, adjustable in settings) by capturing cards from the board. If the deck runs out, the player with the highest score wins.
🃏 Setup

Use a standard 52-card deck (no Jokers).
The app shuffles and deals:
4 cards to each player (you and 2 AI bots).
4 face-up cards to the center board.


Play begins with you, followed by the bots in turn order.

🔁 Gameplay
On your turn:
Capture Cards
Use the dual play areas to build your combo:

Play Area: Place cards (from hand or board) that sum to a target value or match a pair.
Principal Match Area: Place a single card (from hand or board) as the target value or match.

Capture Types:

Pair Capture:
Place a matching card in the Principal Match area and a matching card in the Play Area.
For J, Q, K: Capture all matching cards by placing one in the Principal Match and matching ones in the Play Area.
Requires at least one hand card and one board card across both areas.


Sum Capture (2-10 only):
Place the target card in the Principal Match area.
In the Play Area, use at least one hand card and one board card whose sum equals the Principal Match card’s value.
All cards in both areas are captured.
J, Q, K cannot be used in sums.



Drag cards to the respective areas to build your combo. Both areas will glow green if valid. Click “Submit Move” to capture.
Place a Card

After capturing (or if no capture is possible), drag a hand card to the board to place it and end your turn.

Empty Board

If the board is cleared during your turn and you have cards left, place a hand card on the board to continue.

Bots take their turns automatically based on their difficulty level (set in settings).
🛑 End of a Hand

A hand ends when all players are out of cards.
If the deck isn’t empty:
Deal 4 new cards to each player.
If the board is empty, deal 4 new cards to the board.


A new round begins with the player’s turn.

🪙 Scoring

All cards involved in a capture (from both play areas) are scored:
2–9: 5 points each
10, J, Q, K: 10 points each
Ace: 15 points


Add to your cumulative score.

🏆 Winning

The game ends when the deck runs out.
The player who reaches the target score first (default 500, set in settings) wins, or the highest score wins if no one reaches the target.
Break ties with additional hands.
Click “Restart Game” to play again.

💡 Strategy Tips

Save high-value cards (Aces, Kings) for big captures.
Use J, Q, K to grab all matching cards, but plan carefully since they can’t be used in sums.
Build sums strategically to maximize captured cards.

🛠️ Getting Started
Play Online
Play the game live at stacked-oh5y6e8b-thaddus-cars-projects.vercel.app (note: currently facing submit button issues due to deployment bugs—stay tuned for fixes!).
Run Locally
Prerequisites

A web browser (e.g., Chrome, Firefox).
Git (optional, for cloning the repo).

Installation

Clone the repo:git clone https://github.com/toocheesy/STACKED.git
cd STACKED


Open index.html in your browser to play:
On Windows: Right-click index.html and select "Open with" > your browser.
Or drag index.html into your browser.



Deploy to Vercel
You have GitHub and Vercel set up. Use these commands to deploy:

Stage changes:git add .


Commit changes:git commit -m "Update game logic or fix deployment issues"


Push to trigger deployment:git push origin main


Check deployment status in your Vercel dashboard and test the live URL.

📂 Project Structure
STACKED/
├── assets/
│   ├── sounds/         # Audio files (e.g., shuffle.mp3, capture.mp3)
│   ├── cards/          # Card images (optional)
├── css/
│   ├── styles.css      # All CSS
├── js/
│   ├── ai.js           # AI bot moves
│   ├── deck.js         # Deck creation and dealing
│   ├── gameLogic.js    # Capture and scoring logic
│   ├── main.js         # Main game loop
├── index.html          # Main HTML file
├── README.md           # This file
├── vercel.json         # Vercel deployment configuration

🛠️ Tech Stack

Frontend: HTML, CSS, vanilla JavaScript.
Assets: Audio files for sound effects (pending implementation).
Hosting: Vercel, with GitHub for version control.
Client-Side Only: Lightweight, no backend required.

👑 Credits

Created by toocheesy.
Inspired by a timeless family card game.
Developed with AI assistance (Grok by xAI).

📄 License
Creative Commons Attribution-NonCommercial 4.0Play, modify, share—just don’t sell without permission.
📬 Feedback
Submit bugs or ideas via GitHub Issues. We’re currently troubleshooting submit button and deployment issues—your input helps!
🚧 Known Issues

✅ Submit Button Fixed: Submit functionality is now working properly with the latest gameLogic.js and main.js updates.
Reset Disappearing Cards: Cards may disappear on reset if deployment issues persist.
Stay tuned for updates as we resolve these bugs.

Let’s get STACKED!
