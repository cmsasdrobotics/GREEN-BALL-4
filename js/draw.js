/* =====================================================================
   draw.js  --  EVERYTHING YOU CAN SEE.

   Nothing in this file changes the game. It only puts pixels on screen.
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
  var ctx = Draw.ctx;

  // Paint the sky and scenery before moving the camera.
  Draw.background();

  ctx.save();
  ctx.translate(-Draw.cameraX, 0);
  Draw.world();
  Draw.player();
  ctx.restore();
};

// A bright grassy-sky background inspired by classic platform games.
Draw.background = function () {
  var ctx = Draw.ctx;
  var width = CONFIG.CANVAS_W;
  var height = CONFIG.CANVAS_H;

  ctx.fillStyle = "#83d8ff";
  ctx.fillRect(0, 0, width, height);

  // Soft clouds stay attached to the screen while the level scrolls.
  Draw.cloud(110, 62, 1.0);
  Draw.cloud(410, 105, 0.75);
  Draw.cloud(700, 52, 1.15);

  // Distant green hills.
  ctx.fillStyle = "#69c96b";
  ctx.beginPath();
  ctx.moveTo(0, 315);
  ctx.quadraticCurveTo(130, 220, 270, 315);
  ctx.quadraticCurveTo(420, 205, 590, 315);
  ctx.quadraticCurveTo(700, 235, 800, 300);
  ctx.lineTo(800, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
};

Draw.cloud = function (x, y, scale) {
  var ctx = Draw.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(0, 12, 18, 0, Math.PI * 2);
  ctx.arc(22, 2, 25, 0, Math.PI * 2);
  ctx.arc(51, 13, 17, 0, Math.PI * 2);
  ctx.fillRect(0, 12, 51, 18);
  ctx.fill();
  ctx.restore();
};

Draw.world = function () {
  var ctx = Draw.ctx;
  var size = CONFIG.TILE;
  var firstCol = Math.floor(Draw.cameraX / size) - 1;
  var lastCol = firstCol + Math.ceil(CONFIG.CANVAS_W / size) + 2;

  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = firstCol; col <= lastCol; col++) {
      var here = Level.charAt(col, row);
      var x = col * size;
      var y = row * size;

      if (here === "#") { Draw.block(x, y, size); }
      if (here === "^") { Draw.spike(x, y, size); }
      if (here === "F") { Draw.finish(x, y, size); }
    }
  }
};

Draw.block = function (x, y, size) {
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

Draw.spike = function (x, y, size) {
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

// The player is a green ball with a friendly face.
Draw.player = function () {
  var ctx = Draw.ctx;
  var r = CONFIG.PLAYER_RADIUS;
  var centerX = Player.x + CONFIG.PLAYER_SIZE / 2;
  var centerY = Player.y + CONFIG.PLAYER_SIZE / 2;

  ctx.fillStyle = "#35d65b";
  ctx.strokeStyle = "#176b35";
  ctx.lineWidth = CONFIG.LINE_WIDTH;
  ctx.beginPath();
  ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Two eyes.
  ctx.fillStyle = "#17251b";
  ctx.beginPath();
  ctx.arc(centerX - 6, centerY - 4, 2.5, 0, Math.PI * 2);
  ctx.arc(centerX + 6, centerY - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // A small happy smile.
  ctx.beginPath();
  ctx.arc(centerX, centerY + 1, 8, 0.15, Math.PI - 0.15);
  ctx.strokeStyle = "#17251b";
  ctx.lineWidth = 2;
  ctx.stroke();
};
