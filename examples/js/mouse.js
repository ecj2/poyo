"use strict";

let bitmap_bee;
let bitmap_rectangle;

const CANVAS_W = 640;
const CANVAS_H = 360;

let x = 0;
let y = 0;

let velocity_x = 0;
let velocity_y = 0;

let offset_x = 0;
let offset_y = 0;

let last_mouse_x = 0;
let last_mouse_y = 0;

let is_dragging = false;
let is_colliding = false;

function start() {

  // Show the canvas.
  document.getElementById("poyo").style = "display: inherit";

  // Hide the "load example" link.
  document.getElementById("toggle").style = "display: none";

  // Start the example.
  main();
}

async function main() {

  if (!Poyo.initialize(CANVAS_W, CANVAS_H)) {

    // Failed to initialize Poyo.
    Poyo.displayError(Poyo.getLastError());
  }

  await loadResources();

  // Spawn the bee in the center of the canvas.
  x = (CANVAS_W - bitmap_bee.width) / 2;

  Poyo.createGameLoop(loop);
}

async function loadResources() {

  // Use linear texture filtering.
  Poyo.setNewBitmapFlags(Poyo.MIN_LINEAR, Poyo.MAG_LINEAR);

  bitmap_bee = await Poyo.loadBitmap("data/png/bee.png");

  if (!bitmap_bee) {

    // Couldn't load bee.png.
    Poyo.displayError(Poyo.getLastError());
  }

  // Scale-down bitmap_bee by half.
  bitmap_bee = createScaledBitmap(bitmap_bee, 0.5);

  createRectangle();
}

function createScaledBitmap(bitmap, scale) {

  let scaled_bitmap = Poyo.createBitmap(bitmap.width * scale, bitmap.height * scale);

  Poyo.setDrawTarget(scaled_bitmap);

  Poyo.drawScaledBitmap(bitmap, 0, 0, scale, scale, 0, 0);

  Poyo.revertDrawTarget();

  return scaled_bitmap;
}

function createRectangle() {

  // Create a 1x1 bitmap to use for drawing rectangles.
  bitmap_rectangle = Poyo.createBitmap(1, 1);

  Poyo.setDrawTarget(bitmap_rectangle);

  // Clear to white so the rectangle can be easily tinted later.
  Poyo.clearToColor(Poyo.createColor(255, 255, 255));

  Poyo.revertDrawTarget();
}

function drawRectangle(x, y, w, h, padding, tint) {

  padding *= 2;

  x -= padding / 2;
  y -= padding / 2;

  w += padding;
  h += padding;

  Poyo.drawScaledBitmap(bitmap_rectangle, 0, 0, w, h, x, y, tint);
}

function loop() {

  update();
  render();
}

function update() {

  let mouse_x = Poyo.getMouseX();
  let mouse_y = Poyo.getMouseY();

  let bee_bounding_box = Poyo.createBoundingBox(x, y, bitmap_bee.width, bitmap_bee.height);
  let mouse_bounding_box = Poyo.createBoundingBox(mouse_x, mouse_y, 1, 1);

  is_colliding = Poyo.isColliding(mouse_bounding_box, bee_bounding_box);

  if (is_dragging) {

    setCursor("grabbing");
  }
  else if (is_colliding) {

    setCursor("grab");
  }
  else {

    setCursor("default");
  }

  if (is_colliding && Poyo.isMousePressed(Poyo.MOUSE_LEFT)) {

    // Begin dragging the bee.

    is_dragging = true;

    offset_x = mouse_x - x;
    offset_y = mouse_y - y;

    velocity_x = 0;
    velocity_y = 0;
  }

  if (is_dragging && Poyo.isMouseReleased(Poyo.MOUSE_LEFT)) {

    is_dragging = false;

    // Calculate velocities based on the movement of the mouse between frames.
    velocity_x = mouse_x - last_mouse_x;
    velocity_y = mouse_y - last_mouse_y;
  }

  if (is_dragging) {

    x = mouse_x - offset_x;
    y = mouse_y - offset_y;
  }
  else {

    // Apply velocities.
    x += velocity_x;
    y += velocity_y;

    // Apply friction to horizontal movement.
    velocity_x *= 0.99;

    // Apply gravity.
    velocity_y += 0.5;

    if (x < 0 || x > CANVAS_W - bitmap_bee.width) {

      // Bounce off side walls.
      velocity_x *= -0.5;
    }

    if (y < 0 || y > CANVAS_H - bitmap_bee.height) {

      // Bounce off the floor and ceiling.
      velocity_y *= -0.5;

      if (Math.abs(velocity_y) < 1) {

        // Prevent jittering.
        velocity_y = 0;
      }
    }

    // Keep the bee within the canvas' view.
    x = Poyo.clamp(x, 0, CANVAS_W - bitmap_bee.width);
    y = Poyo.clamp(y, 0, CANVAS_H - bitmap_bee.height);
  }

  last_mouse_x = mouse_x;
  last_mouse_y = mouse_y;
}

function render() {

  Poyo.clearToColor(Poyo.createColor(48, 48, 48));

  if (is_colliding) {

    // Draw a yellow outline.
    drawRectangle(x, y, bitmap_bee.width, bitmap_bee.height, 4, Poyo.createColor(255, 255, 0));
  }

  // Draw the bee.
  Poyo.drawBitmap(bitmap_bee, x, y);
}

function setCursor(value) {

  Poyo.getCanvas().style.cursor = value;
}
