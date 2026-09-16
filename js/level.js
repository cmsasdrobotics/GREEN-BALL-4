/* =====================================================================
   level.js  --  BUILDING THE WORLD OUT OF PIECES.

   A level is a list of piece names. A piece is a little 8-wide,
   10-tall picture. This file glues the pictures together, left to
   right, into one big grid.
   ===================================================================== */

var Level = {
  pieces: null,
  levels: null,
  grid: [],
  cols: 0,
  name: "",
  startX: 0,
  startY: 0
};

// Read both JSON files before starting the game.
Level.loadData = function (whenDone) {
  fetch("data/pieces.json")
    .then(function (r) {
      if (!r.ok) { throw new Error("Could not load data/pieces.json"); }
      return r.json();
    })
    .then(function (piecesFile) {
      Level.pieces = piecesFile;
      return fetch("data/levels.json");
    })
    .then(function (r) {
      if (!r.ok) { throw new Error("Could not load data/levels.json"); }
      return r.json();
    })
    .then(function (levelsFile) {
      Level.levels = levelsFile.levels;
      whenDone();
    })
    .catch(function (error) {
      document.getElementById("message").textContent =
        "Could not load the level files. Check data/pieces.json and data/levels.json.";
      console.error(error);
    });
};

Level.build = function (levelNumber) {
  var level = Level.levels[levelNumber];
  Level.name = level.name;
  Level.grid = [];
  Level.cols = level.pieces.length * CONFIG.PIECE_COLS;

  for (var row = 0; row < CONFIG.ROWS; row++) {
    Level.grid.push("");
  }

  for (var p = 0; p < level.pieces.length; p++) {
    var pieceName = level.pieces[p];
    var piece = Level.pieces[pieceName];

    if (!piece) {
      console.error("No piece named '" + pieceName + "' in data/pieces.json");
      piece = Level.pieces["flat"];
    }

    for (var row = 0; row < CONFIG.ROWS; row++) {
      Level.grid[row] = Level.grid[row] + piece[row];
    }
  }

  Level.findStart();
};

Level.findStart = function () {
  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      if (Level.charAt(col, row) === "S") {
        Level.startX = col * CONFIG.TILE;
        Level.startY = row * CONFIG.TILE;
        return;
      }
    }
  }

  Level.startX = 0;
  Level.startY = 0;
};

Level.charAt = function (col, row) {
  if (row < 0 || row >= CONFIG.ROWS) { return "."; }
  if (col < 0 || col >= Level.cols) { return "."; }
  return Level.grid[row].charAt(col);
};

// Both grass-topped blocks (#) and dirt blocks (D) are solid.
Level.isSolid = function (col, row) {
  var tile = Level.charAt(col, row);
  return tile === "#" || tile === "D";
};

Level.isSpike = function (col, row) {
  var tile = Level.charAt(col, row);
  return tile === "^" || tile === "v";
};

Level.isFinish = function (col, row) {
  return Level.charAt(col, row) === "F";
};

Level.pixelWidth = function () {
  return Level.cols * CONFIG.TILE;
};
