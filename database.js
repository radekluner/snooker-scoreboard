const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Vytvoření tabulky
db.serialize(() => {
  db.run(`
    CREATE TABLE scores (
      id INTEGER PRIMARY KEY,
      player INTEGER,
      points INTEGER,
      description TEXT,
      is_foul BOOLEAN DEFAULT 0,
      scored_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Uložení skóre
function saveScore(player, points, description, isFoul, callback) {
  const adjustedPoints = isFoul ? -points : points; // Faul snižuje skóre
  db.run(
    'INSERT INTO scores (player, points, description, is_foul) VALUES (?, ?, ?, ?)',
    [player, adjustedPoints, description, isFoul ? 1 : 0],
    callback
  );
}

// Získání skóre pro hráče
function getScoresForPlayers() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT player, SUM(points) as total FROM scores GROUP BY player',
      (err, rows) => {
        if (err) return reject(err);

        const scores = rows.reduce(
          (acc, row) => {
            acc[`player${row.player}`] = row.total || 0;
            return acc;
          },
          { player1: 0, player2: 0 }
        );
        resolve(scores);
      }
    );
  });
}

module.exports = {
  saveScore,
  getScoresForPlayers
};
