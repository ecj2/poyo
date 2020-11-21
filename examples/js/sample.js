"use strict";

let font;
let sample;

async function loadResources() {

  font = Poyo.loadFontFace("sans-serif");

  sample = await Poyo.loadSample("data/mp3/example.mp3");

  if (!sample) {

    // Error.
    Poyo.displayError("failed to load example.mp3");
  }
}

function update() {

  if (Poyo.isKeyPressed(Poyo.KEY_SPACE)) {

    if (!Poyo.isSamplePlaying(0)) {

      // Begin playing the sample.
      Poyo.playSample(sample, 1.0, 1.0, true, 0);
    }
    else if (Poyo.isSamplePaused(0)) {

      // Resume the sample if it's paused.
      Poyo.resumeSample(0);
    }
    else if (Poyo.isSamplePlaying(0)) {

      // Pause is the sample if it's playing.
      Poyo.pauseSample(0);
    }
  }
}

function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let canvas_w = Poyo.getCanvasWidth();
  let canvas_h = Poyo.getCanvasHeight();

  // Display instructions.
  Poyo.drawText(font, Poyo.createColor(255, 255, 255), 50, canvas_w / 2, canvas_h / 2 - 50, Poyo.TEXT_ALIGN_CENTER, "Press space to toggle play-back.");
}
