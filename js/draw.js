/* =====================================================================
   draw.js -- EVERYTHING YOU CAN SEE.
   ===================================================================== */

var Draw = {
  canvas: null,
  ctx: null,
  cameraX: 0
};

Draw.setup = function () {
  Draw.canvas = document.getElementById("game");
  Draw.ctx = Draw.canvas.getContext("2d");
};

Draw.updateCamera = function () {
  Draw.cameraX = Player.x - CONFIG.CANVAS_W / 2;
  if (Draw.cameraX < 0) { Draw.cameraX = 0; }
  var furthest = Level.pixelWidth() - CONFIG.CANVAS_W;
  if (furthest < 0) { furthest = 0; }
  if (Draw.cameraX > furthest) { Draw.cameraX = furthest; }
};

Draw.everything = function () {
  Draw.background();
  Draw.ctx.save();
  Draw.ctx.translate(-Draw.cameraX, 0);
  Draw.world();
  Draw.collectibles();
  Draw.enemies();
  Draw.pellets();
  Draw.player();
  Draw.ctx.restore();
};

Draw.background = function () {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#83d8ff";
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  Draw.cloud(110, 62, 1);
  Draw.cloud(410, 105, 0.75);
  Draw.cloud(700, 52, 1.15);
  ctx.fillStyle = "#69c96b";
  ctx.beginPath();
  ctx.moveTo(0, 315);
  ctx.quadraticCurveTo(130, 220, 270, 315);
  ctx.quadraticCurveTo(420, 205, 590, 315);
  ctx.quadraticCurveTo(700, 235, 800, 300);
  ctx.lineTo(800, CONFIG.CANVAS_H);
  ctx.lineTo(0, CONFIG.CANVAS_H);
  ctx.closePath();
  ctx.fill();
};

Draw.cloud = function (x, y, scale) {
  var ctx = Draw.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(0, 12, 18, 0, Math.PI * 2);
  ctx.arc(22, 2, 25, 0, Math.PI * 2);
  ctx.arc(51, 13, 17, 0, Math.PI * 2);
  ctx.fillRect(0, 12, 51, 18);
  ctx.fill();
  ctx.restore();
};

Draw.world = function () {
  var size = CONFIG.TILE;
  var firstCol = Math.floor(Draw.cameraX / size) - 1;
  var lastCol = firstCol + Math.ceil(CONFIG.CANVAS_W / size) + 2;
  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = firstCol; col <= lastCol; col++) {
      var tile = Level.charAt(col, row);
      var x = col * size;
      var y = row * size;
      if (tile === "#") { Draw.grassBlock(x, y, size); }
      if (tile === "D") { Draw.dirtBlock(x, y, size); }
      if (tile === "^") { Draw.spikeUp(x, y, size); }
      if (tile === "v") { Draw.spikeDown(x, y, size); }
      if (tile === "F") { Draw.finish(x, y, size); }
    }
  }
  Draw.endBarrier(Level.pixelWidth(), 0, size);
};

Draw.endBarrier = function (x, y, size) {
  var ctx = Draw.ctx;
  var height = CONFIG.ROWS * size;
  ctx.fillStyle = "#9b633d";
  ctx.fillRect(x, y, size, height);
  ctx.fillStyle = "#55b947";
  ctx.fillRect(x, y, 8, height);
  ctx.strokeStyle = "#4b3427";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2, y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH, height - CONFIG.LINE_WIDTH);
};

Draw.collectibles = function () {
  for (var i = 0; i < Level.ammoPickups.length; i++) {
    var pickup = Level.ammoPickups[i];
    if (pickup.active) {
      var bob = Math.sin(Date.now() / 180 + pickup.x) * 3;
      Draw.ammo(pickup.x, pickup.y + bob, pickup.width);
    }
  }
};

Draw.ammo = function (x, y, size) {
  var ctx = Draw.ctx;
  var centerX = x + size / 2;
  var centerY = y + size / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#ffd447";
  ctx.strokeStyle = "#9b6b00";
  ctx.lineWidth = 2;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.restore();
  ctx.fillStyle = "#6d4800";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+5", centerX, centerY);
};

Draw.enemies = function () {
  for (var i = 0; i < Level.enemies.length; i++) {
    var enemy = Level.enemies[i];
    if (enemy.alive) {
      Draw.enemy(enemy.x, enemy.y, enemy.width, enemy.height, enemy.type);
    }
  }
};

Draw.enemy = function (x, y, width, height, type) {
  var ctx = Draw.ctx;
  var isHopper = type === 2;

  if (!isHopper) {
    var spikeWidth = width * (2 / 3);
    var spikeHeight = height * (1 / 3);
    var spikeLeft = x + (width - spikeWidth) / 2;
    ctx.fillStyle = "#b9bec5";
    ctx.strokeStyle = "#6a7079";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spikeLeft, y + 3);
    ctx.lineTo(x + width / 2, y - spikeHeight);
    ctx.lineTo(spikeLeft + spikeWidth, y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = isHopper ? "#3689e8" : "#d93434";
  ctx.strokeStyle = isHopper ? "#174f9c" : "#741c2a";
  ctx.lineWidth = 3;
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
  ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(x + width * 0.32, y + height * 0.34, 3, 0, Math.PI * 2);
  ctx.arc(x + width * 0.68, y + height * 0.34, 3, 0, Math.PI * 2);
  ctx.fill();
};

Draw.pellets = function () {
  for (var i = 0; i < Level.pellets.length; i++) {
    var pellet = Level.pellets[i];
    Draw.pellet(pellet.x, pellet.y, pellet.width, pellet.height);
  }
};

Draw.pellet = function (x, y, width, height) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#fff4a3";
  ctx.strokeStyle = "#d88b00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  Draw.roundedRect(ctx, x, y, width, height, 3);
  ctx.fill();
  ctx.stroke();
};

Draw.roundedRect = function (ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

Draw.grassBlock = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#9b633d";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#55b947";
  ctx.fillRect(x, y, size, 8);
  ctx.strokeStyle = "#4b3427";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2, y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH, size - CONFIG.LINE_WIDTH);
};

Draw.dirtBlock = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#9b633d";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "#4b3427";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.strokeRect(x + CONFIG.LINE_WIDTH / 2, y + CONFIG.LINE_WIDTH / 2,
                 size - CONFIG.LINE_WIDTH, size - CONFIG.LINE_WIDTH);
};

Draw.spikeUp = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#e84b4b";
  ctx.strokeStyle = "#8d2020";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

Draw.spikeDown = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#e84b4b";
  ctx.strokeStyle = "#8d2020";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.lineTo(x + size, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

Draw.finish = function (x, y, size) {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#5a3826";
  ctx.fillRect(x + size / 2 - 2, y, 4, size);
  ctx.fillStyle = "#ffd447";
  ctx.beginPath();
  ctx.moveTo(x + size / 2 + 2, y + 4);
  ctx.lineTo(x + size - 4, y + 12);
  ctx.lineTo(x + size / 2 + 2, y + 20);
  ctx.closePath();
  ctx.fill();
};

Draw.player = function () {
  var ctx = Draw.ctx;
  var r = CONFIG.PLAYER_RADIUS;
  var centerX = Player.x + CONFIG.PLAYER_SIZE / 2;
  var centerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Player.angle);
  ctx.fillStyle = "#35d65b";
  ctx.strokeStyle = "#176b35";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
