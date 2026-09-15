/* =====================================================================
   game.js  --  THE RULES AND THE LOOP.

   The game is always in exactly ONE mode: "playing", "dead", or "won".
   Which mode it is in decides what happens each frame.

   The loop runs about 60 times a second, forever. Every time it runs it
   does the same two things: UPDATE (change the numbers) and DRAW (show
   the numbers).
   ===================================================================== */

var Game = {
  mode: "playing",   // "playing", "dead", or "won"
  levelNumber: 0
};

Game.startLevel = function (levelNumber) {
  Game.levelNumber = levelNumber;
  Level.build(levelNumber);
  Player.reset();
  Game.mode = "playing";
  Game.showMessage("");
};

Game.showMessage = function (text) {
  document.getElementById("message").textContent = text;
};

// --- ONE FRAME --------------------------------------------------------
Game.update = function () {

  // R always restarts current level
  if (Input.restart) {
    Game.startLevel(Game.levelNumber);
    return;
  }
  
  // N goes to next level (only if we won)
  if (Input.nextLevel && Game.mode === "won") {
    var nextLevel = Game.levelNumber + 1;
    if (nextLevel < Level.levels.length) {
      Game.startLevel(nextLevel);
    } else {
      Game.startLevel(CONFIG.START_LEVEL);  // loop back
    }
    return;
  }

  // If we are not playing, nothing moves. We just wait for R.
  if (Game.mode !== "playing") { return; }

  Player.update();

  if (Player.isDead()) {
    Game.mode = "dead";
    Game.showMessage("You hit something. Press R to try again.");
    return;
  }

  if (Player.hasWon()) {
    Game.mode = "won";
    var nextLevel = Game.levelNumber + 1;
    
    // Check if there's a next level
    if (nextLevel < Level.levels.length) {
      Game.showMessage("Level complete! Press N for next level, or R to retry.");
    } else {
      Game.showMessage("You beat all levels! Press R to restart from Level 1.");
      nextLevel = CONFIG.START_LEVEL;  // loop back to first level
    }
    return;
  }
};

// --- THE LOOP ITSELF --------------------------------------------------
Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
