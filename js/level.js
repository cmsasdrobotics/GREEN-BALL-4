// In a collision check, both grass blocks (#) and dirt blocks (D) are solid.
Level.isSolid = function (col, row) {
  var tile = Level.charAt(col, row);
  return tile === "#" || tile === "D";
};
