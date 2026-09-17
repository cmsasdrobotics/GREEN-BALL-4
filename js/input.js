/* =====================================================================
   input.js  --  READING THE KEYBOARD.
   ===================================================================== */

var Input = {
  left: false,
  right: false,
  jump: false,
  restart: false,
  nextLevel: false,
  shootLeft: false,
  shootRight: false
};

window.addEventListener("keydown", function (event) {
  setKey(event.key, true);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].indexOf(event.key) >= 0) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", function (event) {
  setKey(event.key, false);
});

function setKey(key, isDown) {
  if (key === "ArrowLeft" || key === "a" || key === "A") { Input.left = isDown; }
  if (key === "ArrowRight" || key === "d" || key === "D") { Input.right = isDown; }
  if (key === "ArrowUp" || key === " " || key === "w" || key === "W") { Input.jump = isDown; }
  if (key === "n" || key === "N") { Input.nextLevel = isDown; }
  if (key === "r" || key === "R") { Input.restart = isDown; }
  if (key === "q" || key === "Q") { Input.shootLeft = isDown; }
  if (key === "e" || key === "E") { Input.shootRight = isDown; }
}
