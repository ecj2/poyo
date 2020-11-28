"use strict";

let x = 0;
let y = 0;

let font;
let cursor;

async function loadResources() {

  // Hide the mouse cursor.
  Poyo.hideMouse();

  // Create a new bitmap to be used as the cursor.
  cursor = Poyo.createBitmap(16, 16);

  // Set all future drawing operations to take place on the cursor bitmap.
  Poyo.setDrawTarget(cursor);

  // Clear the cursor bitmap to red.
  Poyo.clearToColor(Poyo.createColor(255, 0, 0));

  // Return drawing operations to occur on the canvas.
  Poyo.setDrawTarget(Poyo.getDefaultDrawTarget());

  font = Poyo.loadFontFace("monospace");
}

function update() {

  // Get the mouse's position within the canvas.
  x = Poyo.getMouseX();
  y = Poyo.getMouseY();
}

function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  // Draw the custom cursor.
  Poyo.drawBitmap(cursor, x, y);

  Poyo.drawText(font, Poyo.createColor(255, 255, 255), 30, 0, 0, Poyo.ALIGN_LEFT, `X: ${x}, Y: ${y}`);
}
