"use strict";

function start() {

  // Show canvas.
  document.getElementById("poyo").style = "display: inherit";

  // Hide toggle link.
  document.getElementById("toggle").style = "display: none";

  // Start the example.
  main();
}

async function main() {

  // Initialize Poyo with a canvas size of 768x432 pixels.
  if (!Poyo.initialize(768, 432)) {

    // Failed to initialize Poyo.

    Poyo.getErrors().forEach(

      (error) => {

        // Cycle through initialization errors.
        Poyo.displayError(error);
      }
    );
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
