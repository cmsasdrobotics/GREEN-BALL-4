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

    if (nextX < enemy.chunkLeft || nextX + enemy.width > enemy.chunkRight) {
      blocked = true;
    }

    if (Collide.hitsSolid(nextX, enemy.y, enemy.width, enemy.height) ||
        Level.isSpike(frontCol, Math.floor((enemy.y + enemy.height / 2) / CONFIG.TILE))) {
      blocked = true;
    }

    if (!Level.isSolid(feetCol, feetRow)) {
      blocked = true;
    }

    if (blocked) {
      enemy.direction = -enemy.direction;
    } else {
      enemy.x = nextX;
    }

    if (enemy.type === 2) {
      enemy.vy += CONFIG.GRAVITY;
      if (enemy.vy > CONFIG.MAX_FALL) { enemy.vy = CONFIG.MAX_FALL; }

      if (enemy.onGround) {  
        // walk for a while before hopping again  
        if (enemy.hopCooldown <= 0) {  
          enemy.vy = -(enemy.hopPower + 2);  
          enemy.onGround = false;  
          enemy.hopCooldown = CONFIG.ENEMY2_HOP_PAUSE;  
        } else {  
          enemy.hopCooldown--;  
        }  
      }  

      var stepY = enemy.vy > 0 ? 1 : (enemy.vy < 0 ? -1 : 0);
      for (var j = 0; j < Math.abs(enemy.vy); j++) {
        if (Collide.hitsSolid(enemy.x, enemy.y + stepY, enemy.width, enemy.height)) {  
          if (stepY > 0) {  
            enemy.onGround = true;  
            enemy.hopCooldown = CONFIG.ENEMY2_HOP_PAUSE;  
          }  
          enemy.vy = 0;  
          break;  
        }  

        enemy.y += stepY;
      }
    }
  }
};

Game.handleEnemyCollisions = function (previousPlayerY) {
  var player = {
    x: Player.x,
    y: Player.y,
    width: CONFIG.PLAYER_SIZE,
    height: CONFIG.PLAYER_SIZE
  };

  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    if (!enemy.alive || enemy.type !== 2) { continue; }

    var wasAbove = previousPlayerY + player.height <= enemy.y;
    var isLanding = player.y + player.height >= enemy.y && Player.vy >= 0;
    var overlapsHorizontally = player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x;

    if (wasAbove && isLanding && overlapsHorizontally) {
      enemy.alive = false;
      Player.y = enemy.y - player.height;
      Player.vy = -(CONFIG.JUMP_POWER + 4);
      Player.onGround = false;
    }
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

  var previousPlayerY = Player.y;
  Player.update();
  Game.updateEnemies();
  Game.handleEnemyCollisions(previousPlayerY);

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

    if (Collide.hitsSolid(pellet.x, pellet.y, pellet.width, pellet.height)) {
      Level.pellets.splice(p, 1);
      continue;
    }

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
    Game.showMessage("You died. Press R to try again.");
    return;
  }

  if (Player.hasWon()) {
    Game.mode = "won";
    var next = Game.levelNumber + 1;
    Game.showMessage(next < Level.levels.length
      ? "Level complete! Press N for next level, or R to retry."
      : "You beat all levels! Press N for level 1, or R to retry.");
  }
};

Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
