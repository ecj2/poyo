"use strict";

let x = 0;
let y = 0;

let font;

let color = Poyo.createColor(255, 255, 0);

async function loadResources() {

  font = Poyo.loadFontFace("cursive");
}

function update() {

  if (Poyo.isKeyDown(Poyo.KEY_UP)) {

    // Move the smile up.
    y -= 5;
  }
  else if (Poyo.isKeyDown(Poyo.KEY_DOWN)) {

    // Move the smile down.
    y += 5;
  }

  if (Poyo.isKeyDown(Poyo.KEY_LEFT)) {

    // Move the smile left.
    x -= 5;
  }
  else if (Poyo.isKeyDown(Poyo.KEY_RIGHT)) {

    // Move the smile right.
    x += 5;
  }

  if (Poyo.isKeyPressed(Poyo.KEY_ANY)) {

    // Change the smile's color whenever a color is pressed.
    color = Poyo.createColor(Math.random() * 255 | 0, Math.random() * 255 | 0, Math.random() * 255 | 0);
  }
}

function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  // Draw instructions.
  Poyo.drawText(font, Poyo.createColor(255, 255, 255), 30, 640 / 2, 0, Poyo.ALIGN_CENTER, "Press the arrow keys to move the smile.");

  // Draw the smile.
  Poyo.drawText(font, color, 30, x, y, Poyo.ALIGN_LEFT, ":)");
}
