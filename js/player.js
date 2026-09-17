/* =====================================================================
   player.js  --  THE ROLLING CIRCLE.

   This file owns everything about the player: where it is, how fast it
   is going, and what happens when it hits something.
   ===================================================================== */

var Player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  onGround: false,
  angle: 0,
  ammo: 0,
  facing: 1,
  lastShotDir: 0
};

Player.reset = function () {
  Player.x = Level.startX;
  Player.y = Level.startY;
  Player.vx = 0;
  Player.vy = 0;
  CONFIG.MOVE_SPEED = 0;
  Player.onGround = false;
  Player.angle = 0;
  Player.ammo = 0;
  Player.facing = 1;
  Player.lastShotDir = 0;
};

Player.update = function () {
  var size = CONFIG.PLAYER_SIZE;

  if (Input.left) {
    CONFIG.MOVE_SPEED = CONFIG.MOVE_SPEED - CONFIG.MOVE_VELOCITY;
    Player.facing = -1;
  } else if (Input.right) {
    CONFIG.MOVE_SPEED = CONFIG.MOVE_SPEED + CONFIG.MOVE_VELOCITY;
    Player.facing = 1;
  } else {
    CONFIG.MOVE_SPEED = CONFIG.MOVE_SPEED * CONFIG.MOVE_FRICTION;
  }

  if (CONFIG.MOVE_SPEED > CONFIG.MAX_VELOCITY) { CONFIG.MOVE_SPEED = CONFIG.MAX_VELOCITY; }
  if (CONFIG.MOVE_SPEED < -CONFIG.MAX_VELOCITY) { CONFIG.MOVE_SPEED = -CONFIG.MAX_VELOCITY; }
  Player.vx = CONFIG.MOVE_SPEED;

  if (Input.jump && Player.onGround) {
    Player.vy = -CONFIG.JUMP_POWER;
    Player.onGround = false;
  }

  Player.vy = Player.vy + CONFIG.GRAVITY;
  if (Player.vy > CONFIG.MAX_FALL) { Player.vy = CONFIG.MAX_FALL; }

  var stepX = 0;
  if (Player.vx > 0.1) { stepX = 1; }
  if (Player.vx < -0.1) { stepX = -1; }

  for (var i = 0; i < Math.abs(Player.vx); i++) {
    if (Collide.hitsSolid(Player.x + stepX, Player.y, size, size)) {
      CONFIG.MOVE_SPEED = 0;
      break;
    }
    Player.x = Player.x + stepX;
    Player.angle = Player.angle + stepX / CONFIG.PLAYER_RADIUS;
  }

  var stepY = 0;
  if (Player.vy > 0) { stepY = 1; }
  if (Player.vy < 0) { stepY = -1; }

  Player.onGround = false;

  for (var j = 0; j < Math.abs(Player.vy); j++) {
    if (Collide.hitsSolid(Player.x, Player.y + stepY, size, size)) {
      if (stepY > 0) { Player.onGround = true; }
      Player.vy = 0;
      break;
    }
    Player.y = Player.y + stepY;
  }

  if (Player.x < 0) { Player.x = 0; }

  Player.tryShoot();
};

Player.tryShoot = function () {
  var dir = 0;
  if (Input.left) { dir = -1; }
  else if (Input.right) { dir = 1; }

  if (dir === 0) {
    Player.lastShotDir = 0;
    return;
  }

  if (Player.ammo <= 0) { return; }
  if (Player.lastShotDir === dir) { return; }

  Player.ammo = Player.ammo - 1;
  Player.lastShotDir = dir;
  Player.facing = dir;

  Level.pellets.push({
    x: Player.x + CONFIG.PLAYER_SIZE / 2 - 4,
    y: Player.y + CONFIG.PLAYER_SIZE / 2 - 3,
    width: 8,
    height: 6,
    vx: dir * 12
  });
};

Player.isDead = function () {
  var size = CONFIG.PLAYER_SIZE;

  if (Collide.hitsSpike(Player.x, Player.y, size, size)) { return true; }
  if (Player.y > CONFIG.CANVAS_H + 200) { return true; }

  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    if (enemy.alive && Collide.overlaps({ x: Player.x, y: Player.y, width: size, height: size }, enemy)) {
      return true;
    }
  }

  return false;
};

Player.hasWon = function () {
  var size = CONFIG.PLAYER_SIZE;
  return Collide.hitsFinish(Player.x, Player.y, size, size);
};
