"use strict";

function start() {

  // Start the example.
  main();

  // Show canvas.
  document.getElementById("poyo").style = "display: inherit";

  // Hide toggle link.
  document.getElementById("toggle").style = "display: none";
}

async function main() {

  // Initialize Poyo with a canvas size of 640x360 pixels.
  if (!Poyo.initialize(640, 360)) {

    // Failed to initialize Poyo.
    Poyo.displayError(Poyo.getLastError());
  }

  // Wait for resources to be loaded.
  await loadResources();

  // Call loop() 60 times per second.
  Poyo.createGameLoop(loop);
}

function loop() {

  update();
  render();
}

function update() {}

function render() {}

async function loadResources() {}
