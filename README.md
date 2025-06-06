STACKED! The Card Game 🎴
A fast-paced, strategic card game where pairing and arithmetic collide. Capture cards, stack your combos, and race to victory in this modern take on a classic family favorite.
🧠 What Is STACKED!?
STACKED! is a card game for 2–4 players (currently single-player with 2 AI bots) using a standard 52-card deck. Capture cards from a shared board by matching pairs or using sums, aiming to score the most points. It blends classic matching with tactical math-based strategy, brought to life as a web app.
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
Use one hand card and at least one board card to:

Pair Capture:
For 2–10: Match a board card’s value to capture it (e.g., play a 5 to capture a 5).
For J, Q, K: Capture all matching cards on the board (e.g., play a K to capture all K’s). J, Q, K cannot be used in sums.


Sum Capture (2–10 only):
Use two board cards whose sum is 5 times your hand card’s value to capture a third board card that matches your hand card (e.g., with a hand 2, use board cards 6 + 4 = 10 to capture another 2).
J, Q, K cannot be used in sums.



You can make multiple captures in one turn with the same hand card. Drag cards to the play area to build your combo, then click “Submit Move” to capture. The play area glows green if your combo is valid.
Place a Card

After capturing (or if no capture is possible), drag 1 hand card to the board to place it and end your turn.

Empty Board

If the board is cleared during your turn and you have cards left, place 1 hand card on the board to continue the game.

Bots take their turns automatically, making captures or placing cards based on their difficulty level (set in settings).
🛑 End of a Hand

A hand ends when all players are out of cards.
If the deck isn’t empty:
Deal 4 new cards to each player.
If the board is empty, deal 4 new cards to the board.


A new round begins with the player’s turn.

🪙 Scoring
At the end of each hand, score your captured cards:

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
Use J, Q, K to quickly grab all matching cards, but plan carefully since they can’t be used in sums.
Time your combos to clear the board and gain an edge over the bots.

🛠️ Getting Started
Play Online
Play the game live at stacked-orcin.vercel.app.
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
You already have GitHub and Vercel set up, so here are the deployment commands:

Ensure all changes are committed:git add .
git commit -m "Update README with correct rules and deployment instructions"


Push to GitHub to trigger a Vercel deployment:git push origin main


Vercel will auto-deploy your site. Check the deployment status in your Vercel dashboard, and visit stacked-orcin.vercel.app to confirm the update.

📂 Project Structure
STACKED/
├── assets/
│   ├── sounds/         # Audio files (shuffle.mp3, capture.mp3)
│   ├── cards/          # Card images (optional)
├── css/
│   ├── styles.css      # All CSS
├── js/
│   ├── deck.js         # Deck creation and dealing
│   ├── gameLogic.js    # Capture and scoring logic
│   ├── ai.js           # AI bot moves
│   ├── main.js         # Main game loop
├── index.html          # Main HTML file
├── README.md           # This file
├── vercel.json         # Vercel deployment configuration

🛠️ Tech Stack

Frontend: HTML, CSS, vanilla JavaScript.
Assets: Audio files for sound effects.
Hosting: Vercel, with GitHub for version control.
Client-Side Only: Lightweight, no backend required.

👑 Credits

Created by toocheesy.
Inspired by a timeless family card game.
Developed with AI assistance (Grok by xAI).

📄 License
Creative Commons Attribution-NonCommercial 4.0Play, modify, share—just don’t sell without permission.
📬 Feedback
Submit bugs or ideas via GitHub Issues.Let’s get STACKED!
