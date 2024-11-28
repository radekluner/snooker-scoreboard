const express = require('express');
const db = require('./database');
const router = express.Router();

let currentPlayer = 1; // Hráč 1 je výchozí

// HTML stránka s tlačítky
router.get('/', async (req, res) => {
  const scores = await db.getScoresForPlayers(); // Získání skóre pro oba hráče
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Snooker Counter</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin: 20px;
        }
        .score-board {
          margin-bottom: 20px;
        }
        .score-buttons, .foul-buttons {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ball-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          font-weight: bold;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }
        .ball-button:hover {
          transform: scale(1.1);
        }
        .ball-red { background-color: red; }
        .ball-yellow { background-color: yellow; color: black; }
        .ball-green { background-color: green; }
        .ball-brown { background-color: brown; }
        .ball-blue { background-color: blue; }
        .ball-pink { background-color: pink; color: black; }
        .ball-black { background-color: black; }
        .foul-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: gray;
          color: white;
          font-size: 16px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }
        .foul-button:hover {
          transform: scale(1.1);
        }
    </style>
    </head>
    <body>
      <h1>Snooker Counter</h1>
      <div class="score-board">
        <h2>Skóre</h2>
        <p>Hráč 1: <span id="player1-score">${scores.player1}</span> bodů</p>
        <p>Hráč 2: <span id="player2-score">${scores.player2}</span> bodů</p>
        <button onclick="switchPlayer()">Přepnout hráče (aktuálně Hráč ${currentPlayer})</button>
      </div>
      <div class="score-buttons">
        <h2>Koule</h2>
        ${[
          { color: 'Červená', points: 1, css_class: 'ball-red' },
          { color: 'Žlutá', points: 2, css_class: 'ball-yellow' },
          { color: 'Zelená', points: 3, css_class: 'ball-green' },
          { color: 'Hnědá', points: 4, css_class: 'ball-brown' },
          { color: 'Modrá', points: 5, css_class: 'ball-blue' },
          { color: 'Růžová', points: 6, css_class: 'ball-pink' },
          { color: 'Černá', points: 7, css_class: 'ball-black' }
        ]
          .map(
            ({ color, points , css_class}) =>
              `<button class="ball-button ${css_class}" onclick="sendScore(${points}, 'Bod za ${color}')"></button>`
          )
          .join('')}
      </div>
      <div class="foul-buttons">
        <h2>Faul</h2>
        ${[4, 5, 6, 7]
          .map(
            (points) =>
              `<button class="foul-button" onclick="sendScore(${points}, 'Faul za ${points} b', true)">Faul (${points} b)</button>`
          )
          .join('')}
      </div>
      <script>
        let currentPlayer = ${currentPlayer};

        function switchPlayer() {
          currentPlayer = currentPlayer === 1 ? 2 : 1;
        }

        function sendScore(points, description, isFoul = false) {
          fetch('/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, description, player: currentPlayer, isFoul })
          })
          .then(response => response.json())
          .then(data => {
            // Aktualizace skóre na stránce
            document.getElementById('player1-score').innerText = data.scores.player1;
            document.getElementById('player2-score').innerText = data.scores.player2;
          })
          .catch(error => alert('Nastala chyba: ' + error));
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// API endpoint pro zaznamenání bodů
router.post('/score', async (req, res) => {
  const { points, description, player, isFoul } = req.body;

  if (!points || typeof points !== 'number' || points < 1 || points > 7) {
    return res.status(400).json({ message: 'Neplatné bodové ohodnocení.' });
  }

  try {
    await db.saveScore(player, points, description, isFoul);
    const scores = await db.getScoresForPlayers();
    res.json({ message: `${description} bylo uloženo pro Hráče ${player}.`, scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chyba při ukládání do databáze.' });
  }
});

module.exports = router;
