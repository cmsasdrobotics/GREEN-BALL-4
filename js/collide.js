/* =====================================================================
   collide.js  --  DID THE PLAYER TOUCH SOMETHING?

   The player is a BOX for collision, even though it is drawn as a
   circle. Boxes are much easier to check, and nobody can tell.
   ===================================================================== */

var Collide = {};

Collide.squaresUnder = function (x, y, width, height) {
  var firstCol = Math.floor(x / CONFIG.TILE);
  var lastCol  = Math.floor((x + width  - 1) / CONFIG.TILE);
  var firstRow = Math.floor(y / CONFIG.TILE);
  var lastRow  = Math.floor((y + height - 1) / CONFIG.TILE);

  var squares = [];
  for (var row = firstRow; row <= lastRow; row++) {
    for (var col = firstCol; col <= lastCol; col++) {
      squares.push({ col: col, row: row });
    }
  }
  return squares;
};

Collide.hitsSolid = function (x, y, width, height) {
  var squares = Collide.squaresUnder(x, y, width, height);
  for (var i = 0; i < squares.length; i++) {
    if (Level.isSolid(squares[i].col, squares[i].row)) { return true; }
  }
  return false;
};

// Check if there's a slope surface below the player. Returns the Y position
// of the slope surface, or null if no slope is found.
Collide.findSlopeBelow = function (x, y, width, height) {
  var footY = y + height;
  var footX = x + width / 2;
  
  // Check the row directly below the feet
  var footRow = Math.floor(footY / CONFIG.TILE);
  var slopeY = Level.slopeSurfaceY(footX, footRow);
  
  if (slopeY !== null && footY <= slopeY + CONFIG.SLOPE_SNAP) {
    return { y: slopeY, row: footRow };
  }
  
  // If not close enough, check one more row below
  slopeY = Level.slopeSurfaceY(footX, footRow + 1);
  if (slopeY !== null && footY <= slopeY + CONFIG.SLOPE_SNAP) {
    return { y: slopeY, row: footRow + 1 };
  }
  
  return null;
};

Collide.hitsSpike = function (x, y, width, height) {
  var squares = Collide.squaresUnder(x, y, width, height);
  for (var i = 0; i < squares.length; i++) {
    if (Level.isSpike(squares[i].col, squares[i].row)) { return true; }
  }
  return false;
};

Collide.hitsBounce = function (x, y, width, height) {  
  var squares = Collide.squaresUnder(x, y, width, height);  
  for (var i = 0; i < squares.length; i++) {  
    if (Level.isBounce(squares[i].col, squares[i].row)) {  
      return true;  
    }  
  }  
  return false;  
};

Collide.hitsFinish = function (x, y, width, height) {
  var squares = Collide.squaresUnder(x, y, width, height);
  for (var i = 0; i < squares.length; i++) {
    if (Level.isFinish(squares[i].col, squares[i].row)) { return true; }
  }
  return false;
};

Collide.overlaps = function (a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
};
