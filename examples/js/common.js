"use strict";

// Call main() once the window has finished loading.
Poyo.setEntryPoint(main);

async function main() {

  // Initialize Poyo with a canvas size of 768x432 pixels.
  if (!Poyo.initialize(768, 432)) {

    // Failed to initialize Poyo.

    Poyo.getErrors().forEach(

      (error) => {

        // Cycle through initialization errors.
        displayError(error);
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

function displayError(message) {

  // Display the error.
  alert(`Error: ${message}!`);

  // Kill the script.
  throw new Error(message + "!");
}
