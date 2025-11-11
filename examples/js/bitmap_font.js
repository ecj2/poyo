"use strict";

const CANVAS_W = 640;
const CANVAS_H = 360;

let bitmap_font_1;
let bitmap_font_2;

let font_size = 36;
let alignment = 2;

let color = Poyo.createColor(255, 128, 128);
let target_color = Poyo.createColor(255, 128, 128);

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

  Poyo.createGameLoop(loop);
}

async function loadResources() {

  // Use linear texture filtering for smoother-looking glyphs.
  Poyo.setNewBitmapFlags(Poyo.MIN_LINEAR, Poyo.MAG_LINEAR);

  bitmap_font_1 = await Poyo.loadBitmapFont("data/png/font.png", 64, 64, 19, -32);

  if (!bitmap_font_1) {

    // Couldn't load font.png.
    Poyo.displayError(Poyo.getLastError());
  }

  // Clone bitmap_font_1. No modifications will be made to this clone.
  bitmap_font_2 = {...bitmap_font_1};
}

function loop() {

  update();
  render();
}

function update() {

  updateColor();
  updateKeyboard();
}

function updateColor() {

  let c = color;
  let t = target_color;

  if (c.r === t.r && c.g === t.g && c.b === t.b) {

    // Generate next random target color.
    target_color.r = Math.random() * 255 | 0;
    target_color.g = Math.random() * 255 | 0;
    target_color.b = Math.random() * 255 | 0;
  }
  else {

    if (c.r > t.r) {

      --c.r;
    }
    else if (c.r < t.r) {

      ++c.r;
    }

    if (c.g > t.g) {

      --c.g;
    }
    else if (c.g < t.g) {

      ++c.g;
    }

    if (c.b > t.b) {

      --c.b;
    }
    else if (c.b < t.b) {

      ++c.b;
    }
  }
}

function updateKeyboard() {

  if (Poyo.isKeyDown(Poyo.KEY_W)) {

    ++font_size;
  }
  else if (Poyo.isKeyDown(Poyo.KEY_S)) {

    --font_size;
  }

  if (Poyo.isKeyDown(Poyo.KEY_D)) {

    ++bitmap_font_1.padding_x;
  }
  else if (Poyo.isKeyDown(Poyo.KEY_A)) {

    --bitmap_font_1.padding_x;
  }

  if (Poyo.isKeyPressed(Poyo.KEY_Z)) {

    ++alignment;

    if (alignment > 2) {

      alignment = 0;
    }
  }
}

function render() {

  Poyo.clearToColor(Poyo.createColor(48, 48, 48));

  let x = 0;
  let y = CANVAS_H / 2 - font_size / 2;

  let text_alignment = Poyo.ALIGN_LEFT;

  let alignment_string = "left";

  if (alignment === 1) {

    x = CANVAS_W;

    text_alignment = Poyo.ALIGN_RIGHT;

    alignment_string = "right";
  }
  else if (alignment === 2) {

    x = CANVAS_W / 2;

    text_alignment = Poyo.ALIGN_CENTER;

    alignment_string = "center";
  }

  let text = "This was drawn with a bitmap font.";

  Poyo.drawBitmapFont(bitmap_font_1, color, font_size, x, y, text_alignment, text);

  let padding_x = bitmap_font_1.padding_x;

  text = `Z  : change text alignment\t\t\t\t\t(${alignment_string})\n`;
  text += `W/S: change font size\t\t\t\t\t\t\t\t\t\t(${font_size})\n`;
  text += `D/A: change horizontal padding (${padding_x})`;

  Poyo.drawBitmapFont(bitmap_font_2, Poyo.createColor(255, 255, 255), 24, 0, 0, Poyo.ALIGN_LEFT, text);
}
