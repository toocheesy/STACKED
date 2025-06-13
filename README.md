STACKED! The Card Game 🎴
A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite. We’re rethinking and refining the experience as of June 13, 2025—join us on this epic journey!
🧠 What Is STACKED!?
STACKED! is a card game for 2–4 players (currently single-player with 2 AI bots) using a standard 52-card deck. Capture cards from a shared board by matching pairs or building sums across dual play areas, aiming to score the most points. It blends classic matching with tactical math-based strategy, brought to life as a web app. We’re currently troubleshooting gameplay flow and bot logic to make it unstoppable!
🎯 Objective
Be the first to reach the target score (default 500 points, adjustable in settings) by capturing cards from the board. If the deck runs out, the player with the highest score wins. We’re working to ensure smooth turns and a clean endgame!
🃏 Setup

Use a standard 52-card deck (no Jokers).
The app shuffles and deals:
4 cards to each player (you and 2 AI bots).
4 face-up cards to the center board.


Play begins with you, followed by the bots in turn order.

🔁 Gameplay
On Your Turn:

Capture Cards
Use the dual play areas to build your combo:
Play Area: Place cards (from hand or board) that sum to a target value or match a pair.
Principal Match Area: Place a single card (from hand or board) as the target value or match.


Capture Types:
Pair Capture: Place a matching card in the Principal Match area and a matching card in the Play Area. For J, Q, K, capture all matching cards by placing one in the Principal Match and matching ones in the Play Area. Requires at least one hand card and one board card across both areas.
Sum Capture (2-10 only): Place the target card in the Principal Match area. In the Play Area, use at least one hand card and one board card whose sum equals the Principal Match card’s value. All cards in both areas are captured. J, Q, K cannot be used in sums.


Drag cards to the respective areas to build your combo. Both areas will glow green if valid. Click “Submit Move” to capture, then place a card to end your turn if you have cards left.


Place a Card
After capturing (or if no capture is possible), drag a hand card to the board to place it and end your turn.


Empty Board
If the board is cleared during your turn and you have cards left, place a hand card on the board to continue.


Bots take their turns automatically based on their difficulty level (set in settings).

🛑 End of a Hand

A hand ends when all players are out of cards.
If the deck isn’t empty:
Deal 4 new cards to each player’s hand (no cards to the board currently due to a bug fix in progress).


A new round begins with the player’s turn, or the game ends if the deck is depleted.

🪙 Scoring

All cards involved in a capture (from both play areas) are scored:
2–9: 5 points each
10, J, Q, K: 10 points each
Ace: 15 points


Add to your cumulative score.

🏆 Winning

The game ends when the deck runs out or a player reaches the target score.
The player with the highest score wins, or the first to hit the target score (default 500, set in settings) claims victory.
Break ties with additional hands.
Click “Restart Game” to play again.

💡 Strategy Tips

Save high-value cards (Aces, Kings) for big captures.
Use J, Q, K to grab all matching cards, but plan carefully since they can’t be used in sums.
Build sums strategically to maximize captured cards.

🛠️ Getting Started
Play Online

Play the game live at https://stacked-orcin.vercel.app (note: currently facing gameplay bugs—stay tuned for fixes as we rethink the approach!).

Run Locally

Prerequisites: A web browser (e.g., Chrome, Firefox). Git (optional, for cloning the repo).
Installation:
Clone the repo: git clone https://github.com/toocheesy/STACKED.git
cd STACKED
Open index.html in your browser:
On Windows: Right-click index.html and select "Open with" > your browser.
Or drag index.html into your browser.





Deploy to Vercel

You have GitHub and Vercel set up. Use these commands to deploy:
Stage changes: git add .
Commit changes: git commit -m "Update game logic or fix deployment issues"
Push to trigger deployment: git push origin main
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
Assets: Audio files for sound effects (pending full implementation).
Hosting: Vercel, with GitHub for version control.
Client-Side Only: Lightweight, no backend required.

👑 Credits

Created by toocheesy.
Inspired by a timeless family card game.
Developed with AI assistance (Grok by xAI).

📄 License

Creative Commons Attribution-NonCommercial 4.0: Play, modify, share—just don’t sell without permission.

📬 Feedback

Submit bugs or ideas via GitHub Issues. We’re currently rethinking gameplay after encountering:
Bots making “undefined” combos (e.g., Bot 2 with 9♠).
Game freezing after all players are out of cards due to a dealAfterBots error.


Your input helps us refine STACKED! as we pivot our approach!

🚧 Known Issues

✅ Submit Button Fixed: Submit functionality works with recent updates.
🛠️ Undefined Combos: Bots occasionally use invalid cards (e.g., “undefined” in combos), under investigation.
🛠️ Game Freeze: Freezes after all players are out of cards, linked to dealAfterBots errors in checkGameEnd.
🛠️ Turn Flow: Player can’t always place a card after a combo, and bot turns may stall.
Stay tuned as we rethink and resolve these bugs!

🎮 Current State (June 13, 2025)

We’ve made solid progress through the first round, with combos and initial bot turns working. However, undefined combos and game freezes after all hands are empty are blocking a full round. We’re shifting from code tweaks to alternative troubleshooting (e.g., logging, mock data) and exploring screen recordings to pinpoint issues. The goal is to stabilize gameplay before adding new features!

Let’s Get STACKED! 🚀
