/* =====================================================================
   game.js  --  THE RULES AND THE LOOP.
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

// Enemies patrol only inside the chunk where they were placed. They turn
// around before blocks, spikes, pits, and chunk boundaries.
Game.updateEnemies = function () {
  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    if (!enemy.alive) { continue; }

    var nextX = enemy.x + enemy.direction * enemy.speed;
    var feetY = enemy.y + enemy.height + 1;
    var frontX = enemy.direction > 0 ? nextX + enemy.width : nextX;
    var frontCol = Math.floor(frontX / CONFIG.TILE);
    var feetCol = Math.floor((frontX + (enemy.direction > 0 ? -1 : 0)) / CONFIG.TILE);
    var feetRow = Math.floor(feetY / CONFIG.TILE);
    var blocked = false;

    // Stay inside the piece/chunk where the enemy was placed.
    if (nextX < enemy.chunkLeft || nextX + enemy.width > enemy.chunkRight) {
      blocked = true;
    }

    // Turn at a wall or any spike in front of the enemy.
    if (Collide.hitsSolid(nextX, enemy.y, enemy.width, enemy.height) ||
        Level.isSpike(frontCol, Math.floor((enemy.y + enemy.height / 2) / CONFIG.TILE))) {
      blocked = true;
    }

    // Turn before a pit: there must be ground under the next step.
    if (!Level.isSolid(feetCol, feetRow)) {
      blocked = true;
    }

    if (blocked) {
      enemy.direction = -enemy.direction;
      continue;
    }

    enemy.x = nextX;
  }
};

Game.update = function () {
  if (Input.restart) {
    Game.startLevel(Game.levelNumber);
    return;
  }

  if (Input.nextLevel && Game.mode === "won") {
    var nextLevel = Game.levelNumber + 1;
    Game.startLevel(nextLevel < Level.levels.length ? nextLevel : CONFIG.START_LEVEL);
    return;
  }

  if (Game.mode !== "playing") { return; }

  Player.update();
  Game.updateEnemies();

  for (var i = 0; i < Level.ammoPickups.length; i++) {
    var pickup = Level.ammoPickups[i];
    if (pickup.active && Collide.overlaps({
      x: Player.x, y: Player.y,
      width: CONFIG.PLAYER_SIZE, height: CONFIG.PLAYER_SIZE
    }, pickup)) {
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

    if (p >= 0 && Level.pellets[p] &&
        (Level.pellets[p].x < 0 || Level.pellets[p].x > Level.pixelWidth())) {
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
    var next = Game.levelNumber + 1;
    Game.showMessage(next < Level.levels.length
      ? "Level complete! Press N for next level, or R to retry."
      : "You beat all levels! Press R to restart from Level 1.");
  }
};

Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
