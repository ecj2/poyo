# Poyo Reference

Welcome to Poyo's reference document. This document briefly details the library's core methods and functionality.

---

## Mouse

Poyo sports a multitude of easy-to-use methods to help you interface with the mouse.

---

**Poyo.getMouseX()**

```js
Poyo.getMouseX()
```

Returns the mouse's horizontal offset relative to the canvas.

---

**Poyo.getMouseY()**

```js
Poyo.getMouseY()
```

Returns the mouse's vertical offset relative to the canvas.

---

**Poyo.getMouseWheel()**

```js
Poyo.getMouseWheel()
```

Returns `1` when scrolling forward, `-1` when scrolling backward, and `0` when not scrolling the mouse wheel at all.

---

**Poyo.hideMouse()**

```js
Poyo.hideMouse()
```

Hides the mouse cursor on the canvas.

---

**Poyo.showMouse()**

```js
Poyo.showMouse()
```

Shows the mouse cursor on the canvas.

---

**Poyo.isMouseHidden()**

```js
Poyo.isMouseHidden()
```

Returns `true` if the mouse is hidden on the canvas, or `false` otherwise.

---

**Poyo.lockMouse()**

```js
Poyo.lockMouse()
```

Locks the mouse to the canvas, allowing the mouse's X and Y values to dip outside of the bounds of the canvas. For compatibility with Firefox, it is suggested to wrap this method call inside of an event listener, like so:

```js
function main() {

  // Initialize, load resources, et cetera...

  Poyo.getCanvas().addEventListener("click", handleMouseClick);
}

function handleMouseClick() {

  if (condition_to_lock_mouse) {

    Poyo.lockMouse();
  }
}
```

---

**Poyo.unlockMouse()**

```js
Poyo.unlockMouse()
```

Unlocks the mouse from the canvas.

---

**Poyo.isMouseLocked()**

```js
Poyo.isMouseLocked()
```

Returns `true` if the mouse is locked to the canvas, or `false` otherwise.

---

**Poyo.isMouseFocused()**

```js
Poyo.isMouseFocused()
```

Returns `true` if the mouse is hovering over the canvas, or `false` if not.

---

**Poyo.isMouseUp()**

```js
Poyo.isMouseUp(button)
```

Returns `true` if the given mouse `button` is not being held down, or `false` otherwise. Values include `Poyo.MOUSE_LEFT`, `Poyo.MOUSE_MIDDLE`, `Poyo.MOUSE_RIGHT`, and `Poyo.MOUSE_ANY`.

---

**Poyo.isMouseDown()**

```js
Poyo.isMouseDown(button)
```

Returns `true` if the given mouse `button` is being held down, or `false` otherwise. Values include `Poyo.MOUSE_LEFT`, `Poyo.MOUSE_MIDDLE`, `Poyo.MOUSE_RIGHT`, and `Poyo.MOUSE_ANY`.

```js
function update() {

  if (Poyo.isMouseDown(Poyo.MOUSE_LEFT)) {

    Player.useWeapon();
  }
}
```

---

**Poyo.isMousePressed()**

```js
Poyo.isMousePressed(button)
```

Returns `true` if the given mouse `button` was pressed since the last frame, or `false` otherwise. Values include `Poyo.MOUSE_LEFT`, `Poyo.MOUSE_MIDDLE`, `Poyo.MOUSE_RIGHT`, and `Poyo.MOUSE_ANY`.

---

**Poyo.isMouseReleased()**

```js
Poyo.isMouseReleased(button)
```

Returns `true` if the given mouse `button` was pressed and released since the last frame, or `false` otherwise. Values include `Poyo.MOUSE_LEFT`, `Poyo.MOUSE_MIDDLE`, `Poyo.MOUSE_RIGHT`, and `Poyo.MOUSE_ANY`.

---

## Keyboard

Just like with mouse routines, Poyo sports several convenient methods for interfacing with the keyboard.

---

**Poyo.isKeyUp()**

```js
Poyo.isKeyUp(key)
```

Returns `true` if the given `key` is not being held down, or `false` otherwise.

---

**Poyo.isKeyDown()**

```js
Poyo.isKeyDown(key)
```

Returns `true` if the given `key` is being held down, or `false` otherwise.

```js
function update() {

  if (Poyo.isKeyDown(Poyo.KEY_W)) {

    Rocket.applyThrust();
  }
}
```

---

**Poyo.isKeyPressed()**

```js
Poyo.isKeyPressed(key)
```

Returns `true` if the given `key` was pressed since the last frame, or `false` otherwise.

---

**Poyo.isKeyReleased()**

```js
Poyo.isKeyReleased(key)
```

Returns `true` if the given `key` was released since the last frame, or `false` otherwise.

---

**Poyo.KEY_\***

Key codes include `Poyo.KEY_0` to `Poyo.KEY_9`; `Poyo.KEY_A` to `Poyo.KEY_Z`; `Poyo.KEY_UP`, `Poyo.KEY_DOWN`, `Poyo.KEY_LEFT`, and `Poyo.KEY_RIGHT` for the arrow keys; and `Poyo.KEY_SPACE` and `Poyo.KEY_ANY`.

---

## Colors

Colors are used to clear draw targets, tint bitmaps, and shade text.

---

**Poyo.createColor()**

```js
Poyo.createColor(r, g, b, a)
```

Returns an object literal containing color values. Each channel ranges from 0 to 255, with `a` representing an optional alpha.

```js
let blue = Poyo.createColor(0, 0, 255);
let translucent_yellow = Poyo.createColor(255, 255, 0, 128);
```

---

**Poyo.clearToColor()**

```js
Poyo.clearToColor(color)
```

Clears the current target to a given color.

```js
function render() {

  // Clear the frame to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  // Draw the rest of the frame here...
}
```

---

## Bitmaps

Bitmaps are images that can be drawn to the screen.

---

**Poyo.loadBitmap()**

```js
Poyo.loadBitmap(file_name)
```

Loads an image file and returns a `promise`. The `promise` resolves to an object literal that can be used with Poyo's drawing methods on success, or `false` on error. Suggested formats include PNG and JPG.

This method must be called from within an `async` function using the `await` keyword, like so:

```js
let bitmap;

async function loadResources() {

  bitmap = await Poyo.loadBitmap("example.png");

  if (!bitmap) {

    // Error...
  }
}
```

---

**Poyo.createBitmap()**

```js
Poyo.createBitmap(width, height)
```

Returns an object literal containing a blank bitmap. The new bitmap can be drawn to via `Poyo.setDrawTarget()`, like so:

```js
let new_bitmap = Poyo.createBitmap(256, 256);

Poyo.setDrawTarget(new_bitmap);

// Draw inside new_bitmap here.

Poyo.setDrawTarget(Poyo.getDefaultDrawTarget());
```

---

**Poyo.getBitmapWidth()**

```js
Poyo.getBitmapWidth(bitmap)
```

Returns the width of `bitmap` in pixels. This is equivalent to `bitmap.width`.

---

**Poyo.getBitmapHeight()**

```js
Poyo.getBitmapHeight(bitmap)
```

Returns the height of `bitmap` in pixels. This is equivalent to `bitmap.height`.

---

**Poyo.getBitmapTexture()**

```js
Poyo.getBitmapTexture(bitmap)
```

Returns a `WebGLTexture` object belonging to `bitmap`.

---

**Poyo.getBitmapFramebuffer()**

```js
Poyo.getBitmapFramebuffer()
```

Returns a `WebGLFramebuffer` object belonging to `bitmap`.

---

**Poyo.drawBitmap()**

```js
Poyo.drawBitmap(bitmap, x, y, tint)
```

Draws a bitmap at the given coordinates with an optional tint.

```js
// Draw the bitmap at the origin.
Poyo.drawBitmap(bitmap, 0, 0);

// Draw the bitmap at 200 by 300, showing only the blue channel.
Poyo.drawBitmap(bitmap, 200, 300, Poyo.createColor(0, 0, 255));

// Draw the bitmap at 150 by 400, with 50% opacity.
Poyo.drawBitmap(bitmap, 150, 400, Poyo.createColor(255, 255, 255, 128));
```

---

**Poyo.drawScaledBitmap()**

```js
Poyo.drawScaledBitmap(bitmap, origin_x, origin_y, scale_x, scale_y, draw_x, draw_y, tint)
```

Draws a scaled bitmap at the given coordinates relative to its own origin with an optional tint.

```js
let w = Poyo.getBitmapWidth(bitmap);
let h = Poyo.getBitmapHeight(bitmap);

// Draw the bitmap at the target's origin scaled-up by a factor of 2 by 3, relative to the bitmap's lower-right corner.
Poyo.drawScaledBitmap(bitmap, w, h, 2, 3, 0, 0);
```

---

**Poyo.drawRotatedBitmap()**

```js
Poyo.drawRotatedBitmap(bitmap, center_x, center_y, draw_x, draw_y, theta, tint)
```

Draws a bitmap at the given coordinates rotated by `theta` relative to `center_x` and `center_y` with an optional tint. Radians are used instead of degrees.

```js
let w = Poyo.getBitmapWidth(bitmap);
let h = Poyo.getBitmapHeight(bitmap);

// Draw the bitmap rotated on its center at the target's origin, using the time since initialization as the theta.
Poyo.drawRotatedBitmap(bitmap, w / 2, h / 2, 0, 0, Poyo.getTime());
```

---

**Poyo.drawClippedBitmap()**

```js
Poyo.drawClippedBitmap(bitmap, start_x, start_y, width, height, x, y, tint)
```

Draws a clipped portion of a bitmap at the given coordinates with an optional tint. The values `start_x` and `start_y` specify where within the bitmap to draw from, and `width` and `height` specify how far over.

```js
let w = Poyo.getBitmapWidth(bitmap);
let h = Poyo.getBitmapHeight(bitmap);

// Draw only the top-right quarter of the bitmap.
Poyo.drawClippedBitmap(bitmap, w / 2, 0, w / 2, h / 2, 0, 0);
```

---

**Poyo.setDrawTarget()**

```js
Poyo.setDrawTarget(bitmap)
```

Forces all future drawing routines to take place on the given bitmap, rather than the canvas. Behind the scenes, this binds `bitmap`'s framebuffer.

---

**Poyo.getDefaultDrawTarget()**

```js
Poyo.getDefaultDrawTarget()
```

Returns a value representing the default framebuffer. This is equivalent to `null`.

```js
// Set future drawing to take place on bitmap rather than the canvas.
Poyo.setDrawTarget(bitmap);

// Draw here...

// Return drawing to the canvas.
Poyo.setDrawTarget(Poyo.getDefaultDrawTarget());

// Draw bitmap like normal to the canvas.
Poyo.drawBitmap(bitmap, 0, 0);
```

---

**Poyo.batchDrawing()**

```js
Poyo.batchDrawing(batch)
```

Enables instance drawing when `batch` is `true`, and disables it when `false`. This is useful for drawing many copies of the same bitmap, as the draw commands get sent in a batch rather than one at a time. This can improve CPU performance.

```js
Poyo.batchDrawing(true);

for (let i = 0; i < 1000; ++i) {

  // Draw a bitmap 1000 times.
  Poyo.drawBitmap(bitmap, x, y);
}

Poyo.batchDrawing(false);
```

This method can only be used to batch a single texture from a single bitmap at a time. In other words, you can not interweave multiple bitmaps in a batch, as only the final source texture is sent to the GPU. This method can be used when drawing text as well.

---

**Poyo.setNewBitmapFlags()**

```js
Poyo.setNewBitmapFlags(... flags)
```

Sets flags to be applied when loading or creating new bitmaps. Values include `Poyo.MIN_NEAREST`, `Poyo.MIN_LINEAR`, `Poyo.MAG_NEAREST`, `Poyo.MAG_LINEAR`, `Poyo.WRAP_CLAMP`, `Poyo.WRAP_REPEAT`, and `Poyo.WRAP_MIRROR`.

```js
// Use linear magnification filtering and mirrored texture wrapping.
Poyo.setNewBitmapFlags(Poyo.MAG_LINEAR, Poyo.WRAP_MIRROR);

let bitmap = await Poyo.loadBitmap("example.png");
```

Bitmaps default to `Poyo.MIN_NEAREST`, `Poyo.MAG_NEAREST`, and `Poyo.WRAP_CLAMP`. The wrap constants only make a difference when used in bespoke shaders.

---

## Fonts and Text

Fonts can be used to draw text.

---

**Poyo.loadFont()**

```js
Poyo.loadFont(file_name, style)
```

Loads the given font with an optional style. The suggested format is TTF. Styles include `Poyo.FONT_STYLE_BOLD`, `Poyo.FONT_STYLE_ITALIC`, and `Poyo.FONT_STYLE_NORMAL` (default). Returns an object literal upon success and `false` on failure.

Like with `Poyo.loadBitmap()`, this method must be called within an `async` function using the `await` keyword, like so:

```js
let font;

async function loadResources() {

  font = await Poyo.loadFont("example.ttf");

  if (!font) {

    // Error...
  }
}
```

---

**Poyo.loadFontFace()**

```js
Poyo.loadFontFace(font_family_name, style)
```

Loads the given font family already known to the browser with an optional style. The style options are the same as with `Poyo.loadFont()`, and this always returns an object literal. Unlike `Poyo.loadFont()`, this can be called outside of an `async` function and without the `await` keyword.

```js
let font;

function loadResources() {

  // Load the Arial font family, which is already known to the browser, with a bold style.
  font = Poyo.loadFontFace("Arial", Poyo.FONT_STYLE_BOLD);
}
```

---

**Poyo.drawText()**

```js
Poyo.drawText(font, color, size, x, y, alignment, text)
```

Draws text of a given color, size, and alignment, at the given coordinates, using the given font.

```js
// Draw left-aligned "Hello!" in red at the target's origin, 50 pixels in size.
Poyo.drawText(font, Poyo.createColor(255, 0, 0), 50, 0, 0, Poyo.TEXT_ALIGN_LEFT, "Hello!")
```

Values for `alignment` include `Poyo.TEXT_ALIGN_LEFT`, `Poyo.TEXT_ALIGN_RIGHT`, and `Poyo.TEXT_ALIGN_CENTER`.

---

## Samples

As far as Poyo is concerned, a _sample_ is a catch-all referring to the management of an audio file.

---

**Poyo.loadSample()**

```js
Poyo.loadSample(file_name)
```

Loads an audio file and returns a `promise`. The `promise` resolves to an object literal that can be used with Poyo's sample methods on success, or `false` on error. MP3 is the suggested format.

This method must be called from within an `async` function using the `await` keyword, like so:

```js
let sample;

async function loadResources() {

  sample = await Poyo.loadSample("example.mp3");

  if (!sample) {

    // Error...
  }
}
```

---

**Poyo.playSample()**

```js
Poyo.playSample(sample, gain, speed, repeat, reference)
```

Plays a given sample at a given gain and speed, and dictates whether or not to repeat upon finishing play-back, and also specifies a reference to use with other sample methods.

The value for `gain` can be anything between 0.0 and 1.0, with 0.0 being muted and 1.0 being full gain. The value for `speed` can be between 0.0 and 2.0, with 0.0 being stopped, 1.0 being normal speed, and 2.0 being twice the speed. The value for `repeat` must be `true` to repeat upon the sample finishing playing, or `false` to play only once. The value for `reference` should be a unique number, which can later be used to modify a playing sample.

```js
// Play the background sample at half gain, full speed, and repeat.
Poyo.playSample(background_sample, 0.5, 1.0, true, 0);
```

---

**Poyo.adjustSample()**

```js
Poyo.adjustSample(reference, gain, speed, repeat)
```

Adjusts the values of a sample that is being played by means of its `reference`.

```js
function update() {

  // Increase gain as the mouse moves left and right across the canvas.
  let gain = Poyo.getMouseX() / Poyo.getCanvasWidth();

  // Increase speed as the mouse moves up and down the canvas.
  let speed = (Poyo.getMouseY() / Poyo.getCanvasHeight()) * 2;

  Poyo.adjustSample(0, gain, speed, true);
}
```

---

**Poyo.stopSample()**

```js
Poyo.stopSample(reference)
```

Stops a given sample.

---

**Poyo.pauseSample()**

```js
Poyo.pauseSample(reference)
```

Pauses a given sample at its current seek.

---

**Poyo.resumeSample()**

```js
Poyo.resumeSample(reference)
```

Resumes a given sample from where it left off.

---

**Poyo.isSamplePaused()**

```js
Poyo.isSamplePaused(reference)
```

Returns `true` if `reference` sample is paused, or `false` otherwise.

---

**Poyo.isSamplePlaying()**

```js
Poyo.isSamplePlaying(reference)
```

Returns `true` if `reference` sample is playing, or `false` otherwise.

---

**Poyo.getSampleSpeed()**

```js
Poyo.getSampleSpeed(reference)
```

Returns the play-back speed of the given `reference` sample. The value ranges from 0.0 to 2.0.

---

**Poyo.getSampleGain()**

```js
Poyo.getSampleGain(reference)
```

Returns the gain of the given `reference` sample, between 0.0 and 1.0.

---

**Poyo.getSampleRepeat()**

```js
Poyo.getSampleRepeat(reference)
```

Returns `true` if the given `reference` sample is set to repeat, or `false` otherwise.

---

**Poyo.getSampleDuration()**

```js
Poyo.getSampleDuration(sample)
```

Returns the duration in seconds of the given sample.

---

**Poyo.getSampleSeek()**

```js
Poyo.getSampleSeek(reference)
```

Returns the seek in seconds of the given `reference` sample.

---

**Poyo.setSampleSeek()**

```js
Poyo.setSampleSeek(reference, seek)
```

Sets the `reference` sample's seek to `seek`.
