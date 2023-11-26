# Poyo

Poyo is a simple 2D game-making library written in JavaScript. It abstracts common tasks&mdash;such as managing mouse and keyboard events, drawing text and images, and playing sounds&mdash;behind an easy-to-use interface.

Poyo works on modern Web browsers which support WebGL 2, such as desktop versions of Chrome and Firefox. It also works on mobile browsers, but doesn't currently abstract touch inputs.

## How to Use

Due to security concerns and limitations imposed by [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), loading resources via the `file://` scheme is not possible. As a result, installing a local a Web server is necessary for loading fonts, bitmaps, and samples.

To begin, you'll need to include the library in the head of an HTML document and add a canvas element to the body for drawing to take place:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <!-- Include the library before other scripts. -->
    <script src="poyo.js"></script>
    <script src="example.js"></script>
  </head>
  <body>
    <div id="toggle">
      <!-- It's ideal to start Poyo with a user gesture, like a click. -->
      <a href="#" onclick="start()">Load Example</a>
    </div>
    <!-- Poyo will draw to this canvas. The ID must always be "poyo". -->
    <canvas id="poyo"></canvas>
  </body>
</html>
```

Then you can move on to actually initializing Poyo, creating the game-loop, and clearing the canvas in JavaScript:

```js
"use strict";

let font;

function start() {

  // Show canvas.
  document.getElementById("poyo").style = "display: inherit";

  // Hide toggle link.
  document.getElementById("toggle").style = "display: none";

  // Start the example.
  main();
}

function main() {

  // Initialize Poyo and set the canvas' dimensions to 768x432 pixels.
  if (!Poyo.initialize(768, 432)) {

    Poyo.getErrors().forEach(

      (error) => {

        // Display initialization errors and kill the script.
        Poyo.displayError(error);
      }
    );
  }

  // Load a bold sans-serif font known to the browser.
  font = Poyo.loadFontFace("sans-serif", Poyo.STYLE_BOLD);

  // Call loop() 60 times per second.
  Poyo.createGameLoop(loop);
}

function loop() {

  // Clear the canvas to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let yellow = Poyo.createColor(255, 255, 0);

  // Draw "Hello, world!" in the center of the canvas in yellow.
  Poyo.drawText(font, yellow, 100, 768 / 2, 432 / 2 - 50, Poyo.ALIGN_CENTER, "Hello, world!");
}
```

Here's the result:

![The result.](https://i.ibb.co/3C4H6mT/helloworld.png)

You can consult the [reference document](REFERENCE.md) and the [examples directory](./examples) to learn more.

## Special Thanks

Much of Poyo's design was heavily inspired by [Allegro 5](https://github.com/liballeg/allegro5), so a big "thank you" to all who contributed to that project.
