# GREEN BALL 4

You have found yourself in an unusual place.
All the land have great detail, nothing you have seen before.
For once, you get to touch grass.

That is it, you finally get to live life as, ball. Or so you thought.

The squares have learned to use interplanetary travel, and have now invaded your planet.
Your goal is to save the balls, before the squares uh, squarify everyone.

## Controls

- A / D (LEFT / RIGHT) arrow - Roll
- W (SPACE or UP arrow) - Jump
- R - Restart the Level
- N - Next Level Once Beaten
- Q / E - Shoot Left or Right, but get Ammo first

## Enemies

- Spike - Patrols left and right, but has a spike that would kill you if you tried to stomp them.
- Hopper - Also patrols left and right, but jumps too, and you can stomp them.
## Upcoming
- Winged - Flies on an area and shoots pellets towards you.

## Weapons
- Pellets - Bullets that can be shot to the left and right,
## Upcoming
- Grenade Launcher - Shoots a rocket wherever aimed (aim with left and right arrows)
  and space to shoot, rocket has gravity and splash damage, you can rocket jump.
- Sniper - Use the mouse to aim and shoot, use your ammo wisely.

# Files n Stuff

## Where everything lives

| If you want to change... | Open this file |
|---|---|
| how high it jumps, how fast it moves, how heavy gravity feels | `js/config.js` |
| which keys do what | `js/input.js` |
| the shape of the levels | `data/levels.json` |
| the level pieces themselves | `data/pieces.json` |
| how the world is built out of pieces | `js/level.js` |
| whether something counts as a hit | `js/collide.js` |
| how the player moves, jumps, and dies | `js/player.js` |
| how anything LOOKS | `js/draw.js` |
| the rules, the win and lose conditions, the loop | `js/game.js` |
| the page around the game | `index.html` and `style.css` |

## How levels work

A level is a list of piece names, in order, left to right.
Open `data/levels.json` and you will see something like this:

    "pieces": ["start", "flat", "gap", "flat", "spikes", "finish"]

Every one of those names is a little picture in `data/pieces.json`.
Each picture is 8 columns wide and 10 rows tall:

    "gap": [
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "###..###",
      "###..###"
    ]

- `.` is empty air
- `#` is a solid block
- `^` is a spike
- `S` is where the player starts
- `F` is the finish

To make a new level: change the list of names.
To make a new piece: copy one, rename it, redraw the picture, then use
that name in a level.

## Things to know before you change anything

- The player is a **box** for collisions and a **circle** for drawing.
  That is on purpose. Boxes are easier to check and nobody can tell.
- Every file is loaded in order at the bottom of `index.html`.
  If you add a new file, add it to that list too.
- The level data is loaded with `fetch()`, which only works over http.
  Use your GitHub Pages link. Opening `index.html` straight off your
  hard drive will not load the levels.
