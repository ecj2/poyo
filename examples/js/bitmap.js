"use strict";

let state = 0;

let scale = 1;
let scale_direction = -1;

let theta = 0.0;

let font;
let bitmap;

let canvas_w;
let canvas_h;

let bitmap_w;
let bitmap_h;

async function loadResources() {

  // Use linear texture filtering.
  Poyo.setNewBitmapFlags(Poyo.MIN_LINEAR, Poyo.MAG_LINEAR);

  font = Poyo.loadFontFace("monospace");

  // Load bee.png.
  bitmap = await Poyo.loadBitmap("data/png/bee.png");

  if (!bitmap) {

    // Error.
    Poyo.displayError("failed to load bee.png");
  }

  canvas_w = Poyo.getCanvasWidth();
  canvas_h = Poyo.getCanvasHeight();

  bitmap_w = Poyo.getBitmapWidth(bitmap);
  bitmap_h = Poyo.getBitmapHeight(bitmap);
}

function update() {

  if (Poyo.isKeyPressed(Poyo.KEY_SPACE)) {

    ++state;

    // Reset scale and rotation.
    scale = 1;
    theta = 0.0;

    if (state > 4) {

      state = 0;
    }
  }

  switch (state) {

    case 1:

      if (scale > 2 || scale < 0) {

        scale_direction *= -1;
      }

      scale += 0.025 * scale_direction;
    break;

    case 2:

      theta = Poyo.getTime();
    break;
  }
}

function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let text = "";

  switch (state) {

    case 0:

      // Draw the bitmap in the center of the canvas.
      Poyo.drawBitmap(bitmap, (canvas_w - bitmap_w) / 2, (canvas_h - bitmap_h) / 2);

      text = "Regular";
    break;

    case 1:

      // Draw the bitmap scaled up and down in the center of the canvas.
      Poyo.drawScaledBitmap(bitmap, bitmap_w / 2, bitmap_h / 2, scale, scale, canvas_w / 2, canvas_h / 2);

      text = "Scaled";
    break;

    case 2:

      // Draw the bitmap rotated clock-wise in the center of the canvas.
      Poyo.drawRotatedBitmap(bitmap, bitmap_w / 2, bitmap_h / 2, canvas_w / 2, canvas_h / 2, theta);

      text = "Rotated";
    break;

    case 3:

      // Draw the bitmap clipped in the center of the canvas.
      Poyo.drawClippedBitmap(bitmap, bitmap_w / 4, bitmap_h / 4, 100, 100, canvas_w / 2 - 50, canvas_h / 2 - 50);

      text = "Clipped";
    break;

    case 4:

      // Draw the bitmap with a red tint in the center of the canvas.
      Poyo.drawBitmap(bitmap, (canvas_w - bitmap_w) / 2, (canvas_h - bitmap_h) / 2, Poyo.createColor(255, 0, 0));

      text = "Tinted";
    break;
  }

  Poyo.batchDrawing(true);

  Poyo.drawText(font, Poyo.createColor(0, 0, 0), 25, canvas_w / 2 + 1, 1, Poyo.TEXT_ALIGN_CENTER, text);
  Poyo.drawText(font, Poyo.createColor(255, 255, 255), 25, canvas_w / 2, 0, Poyo.TEXT_ALIGN_CENTER, text);

  Poyo.drawText(font, Poyo.createColor(0, 0, 0), 25, canvas_w / 2 + 1, canvas_h - 35 + 1, Poyo.TEXT_ALIGN_CENTER, "Press space to toggle drawing routines.");
  Poyo.drawText(font, Poyo.createColor(255, 255, 255), 25, canvas_w / 2, canvas_h - 35, Poyo.TEXT_ALIGN_CENTER, "Press space to toggle drawing routines.");

  Poyo.batchDrawing(false);
}
