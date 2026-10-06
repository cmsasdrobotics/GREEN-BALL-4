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

Level.isSolid = function (col, row) {  
  if (col < 0 && row >= 0 && row < CONFIG.ROWS) { return true; }  
  if (col === Level.cols && row >= 0 && row < CONFIG.ROWS) { return true; }  
  var tile = Level.charAt(col, row);  
  // '_' is "ghost dirt" - draws as dirt but doesn't block collision
  return tile === "#" || tile === "D" || tile === "B";  
};  
   
Level.isBounce = function (col, row) {  
  var tile = Level.charAt(col, row);  
  return tile === "B";  
};  

/* -----------------------------------------------------------------------
   SLOPES.

   Each slope character maps to how "full" the tile is at its LEFT edge
   and its RIGHT edge, as a fraction from 0 (empty) to 1 (completely
   solid, same as a normal block). The ground surface is a straight line
   between those two points, so the player can roll along it smoothly
   instead of hopping down one grid square at a time.

   The 45-degree pieces ('/' and '\') go all the way from 0 to 1 across
   one tile. The 22.5-ish pieces are exactly half that steepness, split
   across two tiles (e.g. "e" then "E") so the line is still continuous
   from tile to tile.

   NOTE: q/Q/w/W (the tall 1-wide corner pieces) are a placeholder for
   now -- flat little half-height and mostly-solid ledges, not a true
   diagonal. A single-column tile can't lean sideways the way these
   values are set up, so once you've settled on how you want those
   corners to actually look/feel, this is the table to come back to.
   ----------------------------------------------------------------------- */
Level.SLOPES = {
  "/":  { left: 0,    right: 1    }, // 45 degrees, rising to the right
  "\\": { left: 1,    right: 0    }, // 45 degrees, rising to the left
  "e":  { left: 0,    right: 0.5  }, // 22.5ish, rising right - lower half
  "E":  { left: 0.5,  right: 1    }, // 22.5ish, rising right - upper half
  "r":  { left: 0.5,  right: 0    }, // 22.5ish, rising left - upper half
  "R":  { left: 1,    right: 0.5  }, // 22.5ish, rising left - lower half
  // NOTE: q/Q/w/W (the tall 1-wide corner pieces) are a best-guess for now.
  // A single-column tile can't lean sideways the way the values above are
  // set up (there's no left/right to interpolate across), so instead of a
  // true diagonal, these give a two-step taper: the small piece is a quarter
  // solid, the big piece three-quarters, so together they round off a
  // corner in two steps instead of one abrupt drop. If that's not the look
  // or feel you're after, tell me what you pictured and I'll rebuild this
  // properly (it likely needs a different, row-based model rather than
  // this left/right one).
  "q":  { left: 0.25, right: 0.25 },
  "Q":  { left: 0.75, right: 0.75 },
  "w":  { left: 0.25, right: 0.25 },
  "W":  { left: 0.75, right: 0.75 }
};

// The exact pixel Y of the ground surface at world x-position `x`, for
// the slope tile sitting in grid row `row`. Returns null if that tile
// isn't one of the slope characters above (normal blocks are handled
// by the regular box collision in collide.js instead).
Level.slopeSurfaceY = function (x, row) {
  var col = Math.floor(x / CONFIG.TILE);
  var shape = Level.SLOPES[Level.charAt(col, row)];
  if (!shape) { return null; }

  var xInTile = (x - col * CONFIG.TILE) / CONFIG.TILE; // 0 at left edge, 1 at right edge
  var heightFrac = shape.left + (shape.right - shape.left) * xInTile;
  return row * CONFIG.TILE + (CONFIG.TILE - heightFrac * CONFIG.TILE);
};

// How steep the slope tile at world x / grid row `row` is, from -1
// (steepest possible, rising left) to 1 (steepest possible, rising
// right). 0 means flat or not a slope at all.
Level.slopeGradient = function (x, row) {
  var col = Math.floor(x / CONFIG.TILE);
  var shape = Level.SLOPES[Level.charAt(col, row)];
  if (!shape) { return 0; }
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
