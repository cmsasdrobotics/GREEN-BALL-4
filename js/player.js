/* =====================================================================
   player.js  --  THE ROLLING CIRCLE.
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
  shootCooldown: 0
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
  Player.shootCooldown = 0;
};

Player.update = function () {
  var size = CONFIG.PLAYER_SIZE;

  // Arrow keys move only. Q/E are reserved for shooting.
  if (Input.left) {
    CONFIG.MOVE_SPEED -= CONFIG.MOVE_VELOCITY;
    Player.facing = -1;
  } else if (Input.right) {
    CONFIG.MOVE_SPEED += CONFIG.MOVE_VELOCITY;
    Player.facing = 1;
  } else {
    CONFIG.MOVE_SPEED *= CONFIG.MOVE_FRICTION;
  }

  if (CONFIG.MOVE_SPEED > CONFIG.MAX_VELOCITY) { CONFIG.MOVE_SPEED = CONFIG.MAX_VELOCITY; }
  if (CONFIG.MOVE_SPEED < -CONFIG.MAX_VELOCITY) { CONFIG.MOVE_SPEED = -CONFIG.MAX_VELOCITY; }
  Player.vx = CONFIG.MOVE_SPEED;

  if (Input.jump && Player.onGround) {
    Player.vy = -CONFIG.JUMP_POWER;
    Player.onGround = false;
  }

  Player.vy += CONFIG.GRAVITY;
  if (Player.vy > CONFIG.MAX_FALL) { Player.vy = CONFIG.MAX_FALL; }

  var stepX = Player.vx > 0.1 ? 1 : (Player.vx < -0.1 ? -1 : 0);
  for (var i = 0; i < Math.abs(Player.vx); i++) {
    if (Collide.hitsSolid(Player.x + stepX, Player.y, size, size)) {
      CONFIG.MOVE_SPEED = 0;
      break;
    }
    Player.x += stepX;
    Player.angle += stepX / CONFIG.PLAYER_RADIUS;
  }

  var stepY = Player.vy > 0 ? 1 : (Player.vy < 0 ? -1 : 0);
  Player.onGround = false;
  for (var j = 0; j < Math.abs(Player.vy); j++) {
    if (Collide.hitsSolid(Player.x, Player.y + stepY, size, size)) {  
      // bounce blocks launch you instead of letting you stand  
      if (stepY > 0 && Collide.hitsBounce(Player.x, Player.y + size, size, 2)) {  
        Player.vy = -CONFIG.BOUNCE_POWER;  
      } else {  
        if (stepY > 0) { Player.onGround = true; }  
        Player.vy = 0;  
      }  
      break;  
    }  

    Player.y += stepY;
  }

  if (Player.x < 0) { Player.x = 0; }
  Player.updateShooting();
};

Player.updateShooting = function () {
  if (Player.shootCooldown > 0) { Player.shootCooldown--; }

  var direction = 0;
  if (Input.shootLeft && !Input.shootRight) { direction = -1; }
  if (Input.shootRight && !Input.shootLeft) { direction = 1; }
  if (direction === 0 || Player.ammo <= 0 || Player.shootCooldown > 0) { return; }

  Player.ammo--;
  Player.facing = direction;
  Player.shootCooldown = 10;
  Level.pellets.push({
    x: Player.x + (direction > 0 ? CONFIG.PLAYER_SIZE : -8),
    y: Player.y + CONFIG.PLAYER_SIZE / 2 - 3,
    width: 8,
    height: 6,
    vx: direction * 12
  });
};

Player.isDead = function () {
  var size = CONFIG.PLAYER_SIZE;
  if (Collide.hitsSpike(Player.x, Player.y, size, size)) { return true; }
  if (Player.y > CONFIG.CANVAS_H + 200) { return true; }

  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    if (enemy.alive && Collide.overlaps({x: Player.x, y: Player.y, width: size, height: size}, enemy)) {
      return true;
    }
  }
  return false;
};

Player.hasWon = function () {
  return Collide.hitsFinish(Player.x, Player.y, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
};
