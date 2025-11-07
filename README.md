# Poyo

Poyo is a tiny JavaScript library for building 2D games. It simplifies common tasks&mdash;like handling inputs, drawing text and images, and playing sounds&mdash;making it perfect for small indie projects.

## Quick Example

Let's write a quick example that draws some text in the center of the canvas. Begin by including `poyo.js` in the head of your HTML document:


```html
<head>
  <meta charset="utf-8">
  <!-- Include the library before other scripts. -->
  <script src="poyo.js"></script>
  <script src="example.js"></script>
</head>
```

Next add a canvas element to the body for drawing to take place:

```html
<body>
  <div id="toggle">
    <!-- It's ideal to start Poyo with a user gesture, like a click. -->
    <a href="#" onclick="start()">Load Example</a>
  </div>
  <!-- Poyo will draw to this canvas. The ID must always be "poyo". -->
  <canvas id="poyo"></canvas>
</body>
```

Now it's time to initialize Poyo, create the game-loop, and clear the canvas in JavaScript:

```js
"use strict";

let font;

function start() {

  // Show the canvas.
  document.getElementById("poyo").style = "display: inherit";

  // Hide the toggle link.
  document.getElementById("toggle").style = "display: none";

  // Start the example.
  main();
}

function main() {

  // Initialize Poyo and set the canvas' dimensions to 640x360 pixels.
  if (!Poyo.initialize(640, 360)) {

    // Display initialization errors and kill the script.
    Poyo.displayError(Poyo.getLastError());
  }

  // Load a bold sans-serif font face.
  font = Poyo.loadFontFace("sans-serif", Poyo.STYLE_BOLD);

  // Call loop() 60 times per second.
  Poyo.createGameLoop(loop);
}

function loop() {

  // Clear the canvas to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let yellow = Poyo.createColor(255, 255, 0);

  // Draw "Hello, world!" in the center of the canvas in yellow.
  Poyo.drawText(font, yellow, 100, 640 / 2, 360 / 2 - 50, Poyo.ALIGN_CENTER, "Hello, world!");
}
```

Here's the result:

![The result.](https://i.ibb.co/3C4H6mT/helloworld.png)

Note: due to security concerns and limitations imposed by [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), loading resources via the `file://` scheme is not possible; as a result, installing a local HTTP server is necessary for loading fonts, bitmaps, and samples.

You can consult the [reference document](REFERENCE.md) and the [examples directory](examples) to learn more.

## Special Thanks

Much of Poyo's design was heavily inspired by [Allegro 5](https://github.com/liballeg/allegro5), so a big "thank you" to all who contributed to that project.
