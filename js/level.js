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
  startY: 0,
  ammoPickups: [],
  enemies: [],
  pellets: []
};

Level.loadData = function (whenDone) {
  var embeddedPieces = window.PIECES_DATA;
  var embeddedLevels = window.LEVELS_DATA;

  if (embeddedPieces && embeddedLevels) {
    Level.pieces = embeddedPieces;
    Level.levels = embeddedLevels.levels;
    whenDone();
    return;
  }

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

  for (var row = 0; row < CONFIG.ROWS; row++) { Level.grid.push(""); }

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

  Level.resetEntities();
  Level.findStart();
};

Level.resetEntities = function () {
  Level.ammoPickups = [];
  Level.enemies = [];
  Level.pellets = [];

  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      var tile = Level.charAt(col, row);

      if (tile === "-") {
        Level.ammoPickups.push({
          x: col * CONFIG.TILE + 6,
          y: row * CONFIG.TILE + 6,
          width: 20,
          height: 20,
          active: true
        });
      }

      if (tile === "1" || tile === "2") {
        var chunk = Math.floor(col / CONFIG.PIECE_COLS);
        Level.enemies.push({
          type: tile === "2" ? 2 : 1,
          x: col * CONFIG.TILE,
          y: row * CONFIG.TILE,
          width: CONFIG.TILE,
          height: CONFIG.TILE,
          direction: -1,
          speed: 1,
          vy: 0,
          hopPower: tile === "2" ? CONFIG.ENEMY2_HOP_POWER : 9,
          hopCooldown: 0,
          onGround: false,
          chunkLeft: chunk * CONFIG.PIECE_COLS * CONFIG.TILE,
          chunkRight: (chunk + 1) * CONFIG.PIECE_COLS * CONFIG.TILE,
          alive: true
        });
      }
    }
  }
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

// "_" (ghost dirt) is deliberately NOT in this list: it is drawn like dirt
// but you can pass straight through it.
Level.isSolid = function (col, row) {
  if (col < 0 && row >= 0 && row < CONFIG.ROWS) { return true; }
  if (col === Level.cols && row >= 0 && row < CONFIG.ROWS) { return true; }
  var tile = Level.charAt(col, row);
  return tile === "#" || tile === "D" || tile === "B";
};

Level.isBounce = function (col, row) {
  var tile = Level.charAt(col, row);
  return tile === "B";
};

// SLOPE SHAPES
// Heights are fractions of a tile: 0 = tile bottom, 1 = tile top.
//
// Simple slopes ( / \ e E r R ) are one straight line: { left, right }.
//
// Tall slopes ( q Q w W ) rise or fall TWO tiles over ONE column, so each
// one is stacked in two tiles. Their shape is a list of segments
// (x0..x1 across the tile, h0..h1 in height). A segment with
// surface:false is only filled-in dirt that you can't stand on -- it is
// there so the picture looks solid.
//
//   rising  (goes up to the right):   q on top of Q
//   falling (goes down to the right): w on top of W
//
//        q                  w
//       /Q                  W\
Level.SLOPES = {
  "/":  { left: 0,   right: 1 },
  "\\": { left: 1,   right: 0 },
  "e":  { left: 0,   right: 0.5 },
  "E":  { left: 0.5, right: 1 },
  "r":  { left: 0.5, right: 0 },
  "R":  { left: 1,   right: 0.5 },

  // upper half of a tall rising slope
  "q": { segs: [
    { x0: 0.5, x1: 1,   h0: 0, h1: 1 }
  ] },
  // lower half of a tall rising slope
  "Q": { segs: [
    { x0: 0,   x1: 0.5, h0: 0, h1: 1 },
    { x0: 0.5, x1: 1,   h0: 1, h1: 1, surface: false }
  ] },
  // upper half of a tall falling slope
  "w": { segs: [
    { x0: 0,   x1: 0.5, h0: 1, h1: 0 }
  ] },
  // lower half of a tall falling slope
  "W": { segs: [
    { x0: 0,   x1: 0.5, h0: 1, h1: 1, surface: false },
    { x0: 0.5, x1: 1,   h0: 1, h1: 0 }
  ] }
};

// Finds the walkable segment of a tall-slope shape at a spot across the
// tile (0 = left edge, 1 = right edge), or null if there is nothing to
// stand on there.
Level.surfaceSegment = function (shape, xInTile) {
  for (var i = 0; i < shape.segs.length; i++) {
    var s = shape.segs[i];
    if (s.surface !== false && xInTile >= s.x0 && xInTile <= s.x1) { return s; }
  }
  return null;
};

// Height (0..1) of the walkable surface at xInTile, or null for none.
Level.slopeHeightAt = function (shape, xInTile) {
  if (shape.segs) {
    var s = Level.surfaceSegment(shape, xInTile);
    if (!s) { return null; }
    return s.h0 + (s.h1 - s.h0) * (xInTile - s.x0) / (s.x1 - s.x0);
  }
  return shape.left + (shape.right - shape.left) * xInTile;
};

Level.slopeSurfaceY = function (x, row) {
  var col = Math.floor(x / CONFIG.TILE);
  var shape = Level.SLOPES[Level.charAt(col, row)];
  if (!shape) { return null; }

  var xInTile = (x - col * CONFIG.TILE) / CONFIG.TILE;
  var heightFrac = Level.slopeHeightAt(shape, xInTile);
  if (heightFrac === null) { return null; }
  return row * CONFIG.TILE + (CONFIG.TILE - heightFrac * CONFIG.TILE);
};

// How steep the slope is: height gained per tile-width moved right.
// 45 degrees = 1, the wide slopes = 0.5, the tall slopes = 2.
Level.slopeGradient = function (x, row) {
  var col = Math.floor(x / CONFIG.TILE);
  var shape = Level.SLOPES[Level.charAt(col, row)];
  if (!shape) { return 0; }

  if (shape.segs) {
    var xInTile = (x - col * CONFIG.TILE) / CONFIG.TILE;
    var s = Level.surfaceSegment(shape, xInTile);
    if (!s) { return 0; }
    return (s.h1 - s.h0) / (s.x1 - s.x0);
  }
  return shape.right - shape.left;
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
