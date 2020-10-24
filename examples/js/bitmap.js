"use strict";

let smile_bitmap;

async function loadResources() {

  // Load smile.png.
  smile_bitmap = await Poyo.loadBitmap("data/png/smile.png");

  if (!smile_bitmap) {

    // Error.
    Poyo.displayError("failed to load smile.png");
  }
}

function render() {

  // Clear to a gray color.
  Poyo.clearToColor(Poyo.createColor(170, 170, 170));

  // Draw the bitmap at the canvas' origin.
  Poyo.drawBitmap(smile_bitmap, 0, 0);
}
