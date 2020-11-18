# Poyo

Poyo is a simple 2D game-making library written in JavaScript. It abstracts common tasks&mdash;such as managing mouse and keyboard events, drawing text and images, and playing sounds&mdash;behind an easy-to-use interface.

Poyo works on modern Web browsers which support WebGL 2, such as desktop versions of Chrome and Firefox.

## Getting Started

Due to security concerns and limitations imposed by [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), loading resources via the `file://` scheme is not possible. As a result, installing a local a Web server is necessary for loading fonts, bitmaps, and samples. I recommend [WAMP](https://www.wampserver.com/en/) for Windows users.

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
    <!-- Poyo will draw to this canvas. The ID must always be "poyo". -->
    <canvas id="poyo"></canvas>
  </body>
</html>
```

Then you can move on to actually initializing Poyo, creating the game-loop, and clearing the canvas in JavaScript:

```js
let font;

function main() {

  // Initialize Poyo and set the canvas' dimensions to 768x432 pixels.
  if (!Poyo.initialize(768, 432)) {

    Poyo.getErrors.forEach(

      (error) => {

        // Display initialization errors and kill the script.
        Poyo.displayError(error);
      }
    );
  }

  // Load a bold sans-serif font known to the browser.
  font = Poyo.loadFontFace("sans-serif", Poyo.FONT_STYLE_BOLD);

  // Call loop() 60 times per second.
  Poyo.createGameLoop(loop);
}

function loop() {

  // Clear the canvas to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  // Draw "Hello, world!" in the center of the canvas in yellow.
  Poyo.drawText(font, Poyo.createColor(255, 255, 0), 100, 768 / 2, 432 / 2 - 50, Poyo.TEXT_ALIGN_CENTER, "Hello, world!");
}

// Call main() once the window has fully loaded.
Poyo.setEntryPoint(main);
```

Here's the result:

![The result.](https://i.ibb.co/3C4H6mT/helloworld.png)

You can consult the [reference document](REFERENCE.md) and the [examples directory](./examples) to learn more.
