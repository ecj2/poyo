"use strict";

let font_face = [];

async function loadResources() {

  // Load font-faces known to the browser. Error-checking is not necessary with this method.
  font_face[0] = Poyo.loadFontFace("tahoma, geneva, sans-serif");
  font_face[1] = Poyo.loadFontFace("courier new, courier, monospace");
  font_face[2] = Poyo.loadFontFace("impact, charcoal, sans-serif", Poyo.FONT_STYLE_BOLD);
  font_face[3] = Poyo.loadFontFace("comic sans ms, cursive, sans-serif", Poyo.FONT_STYLE_ITALIC);
  font_face[4] = Poyo.loadFontFace("georgia, serif");
}

function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let canvas_w = Poyo.getCanvasWidth();
  let canvas_h = Poyo.getCanvasHeight();

  // Draw the text in a batch to boost performance.
  Poyo.batchDrawing(true);

  // Draw the fonts with various colors, sizes, and alignments.
  Poyo.drawText(font_face[0], Poyo.createColor(255, 255, 0), 50, 5, 0, Poyo.TEXT_ALIGN_LEFT, "Tahoma");
  Poyo.drawText(font_face[1], Poyo.createColor(0, 255, 0), 25, canvas_w - 5, 0, Poyo.TEXT_ALIGN_RIGHT, "Courier New");
  Poyo.drawText(font_face[2], Poyo.createColor(0, 0, 255), 75, canvas_w / 2, canvas_h / 2 - 50, Poyo.TEXT_ALIGN_CENTER, "Impact");
  Poyo.drawText(font_face[3], Poyo.createColor(255, 0, 0), 35, 0, canvas_h - 45, Poyo.TEXT_ALIGN_LEFT, "Comic Sans MS");
  Poyo.drawText(font_face[4], Poyo.createColor(255, 128, 128), 60, canvas_w - 5, canvas_h - 80, Poyo.TEXT_ALIGN_RIGHT, "Georgia");

  Poyo.batchDrawing(false);
}
