/* =====================================================================
   game.js  --  THE RULES AND THE LOOP.

   The game is always in exactly ONE mode: "playing", "dead", or "won".
   ===================================================================== */

var Game = {
  mode: "playing",
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

Game.update = function () {
  if (Input.restart) {
    Game.startLevel(Game.levelNumber);
    return;
  }

  if (Input.nextLevel && Game.mode === "won") {
    var nextLevel = Game.levelNumber + 1;
    if (nextLevel < Level.levels.length) {
      Game.startLevel(nextLevel);
    } else {
      Game.startLevel(CONFIG.START_LEVEL);
    }
    return;
  }

  if (Game.mode !== "playing") { return; }

  Player.update();

  for (var i = 0; i < Level.ammoPickups.length; i++) {
    var pickup = Level.ammoPickups[i];
    if (pickup.active && Collide.overlaps({ x: Player.x, y: Player.y, width: CONFIG.PLAYER_SIZE, height: CONFIG.PLAYER_SIZE }, pickup)) {
      pickup.active = false;
      Player.ammo = Player.ammo + 5;
    }
  }

  for (var p = Level.pellets.length - 1; p >= 0; p--) {
    var pellet = Level.pellets[p];
    pellet.x = pellet.x + pellet.vx;

    for (var e = 0; e < Level.enemies.length; e++) {
      var enemy = Level.enemies[e];
      if (enemy.alive && Collide.overlaps(pellet, enemy)) {
        enemy.alive = false;
        Level.pellets.splice(p, 1);
        break;
      }
    }

    if (p >= 0 && Level.pellets[p] && (Level.pellets[p].x < 0 || Level.pellets[p].x > Level.pixelWidth())) {
      Level.pellets.splice(p, 1);
    }
  }

  if (Player.isDead()) {
    Game.mode = "dead";
    Game.showMessage("You hit something. Press R to try again.");
    return;
  }

  if (Player.hasWon()) {
    Game.mode = "won";
    var nextLevel = Game.levelNumber + 1;
    if (nextLevel < Level.levels.length) {
      Game.showMessage("Level complete! Press N for next level, or R to retry.");
    } else {
      Game.showMessage("You beat all levels! Press R to restart from Level 1.");
    }
    return;
  }
};

Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
