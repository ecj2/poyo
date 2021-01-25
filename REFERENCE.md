# Poyo Reference

Welcome to Poyo's reference document. This document briefly details the library's core methods and functionality.

**Table of Contents**
- [Mouse](#mouse)
- [Keyboard](#keyboard)
- [Colors](#colors)
- [Bitmaps](#bitmaps)
- [Fonts and Text](#fonts-and-text)
- [Transformations](#transformations)
- [Samples](#samples)
- [Shaders](#shaders)
- [Miscellaneous](#miscellaneous)

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

**Poyo.drawBatch()**

```js
Poyo.drawBatch(procedure)
```

Executes `procedure` with batching enabled.

```js
Poyo.drawBatch(

  () => {

    for (let i = 0; i < 1000; ++i) {

      // Draw a bitmap 1000 times.
      Poyo.drawBitmap(bitmap, x, y);
    }
  }
);
```

This is equivalent to:

```js
Poyo.batchDrawing(true);

procedure();

Poyo.batchDrawing(false);
```

The same restrictions applied to `Poyo.batchDrawing()` apply here, in that you can not interweave multiple bitmaps in a single batch.

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

Bitmaps default to `Poyo.MIN_NEAREST`, `Poyo.MAG_NEAREST`, and `Poyo.WRAP_REPEAT`.

---

## Fonts and Text

Fonts can be used to draw text.

---

**Poyo.loadFont()**

```js
Poyo.loadFont(file_name, style)
```

Loads the given font with an optional style. The suggested format is TTF. Styles include `Poyo.STYLE_BOLD`, `Poyo.STYLE_ITALIC`, `Poyo.STYLE_BOLD_ITALIC`, and `Poyo.STYLE_NORMAL` (default). Returns an object literal upon success and `false` on failure.

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
  font = Poyo.loadFontFace("Arial", Poyo.STYLE_BOLD);
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
Poyo.drawText(font, Poyo.createColor(255, 0, 0), 50, 0, 0, Poyo.ALIGN_LEFT, "Hello!")
```

Values for `alignment` include `Poyo.ALIGN_LEFT`, `Poyo.ALIGN_RIGHT`, and `Poyo.ALIGN_CENTER`. Also, drawing text is expensive, so it is suggested that you leverage batching when making several `Poyo.drawText()` calls.

```js
// Start batching draw calls.
Poyo.batchDrawing(true);

// Draw several lines of text.
Poyo.drawText(...);
Poyo.drawText(...);
Poyo.drawText(...);
Poyo.drawText(...);
Poyo.drawText(...);

// Release the batch, thus drawing all the text in one fell swoop.
// This improves performance, especially on the CPU.
Poyo.batchDrawing(false);
```

---

## Transformations

Poyo sports a handful of methods to perform affine transformations, like translation, scaling, rotation, and shearing.

---

**Poyo.createTransform()**

```js
Poyo.createTransform()
```

Returns an object literal containing an identity transform and an empty stack array.

```js
let transform = Poyo.createTransform();
```

---

**Poyo.setTransformMode()**

```js
Poyo.setTransformMode(mode)
```

Changes the transform mode to `mode`. Options include `Poyo.MODE_VERTEX` and `Poyo.MODE_TEXTURE`. Poyo initializes to `Poyo.MODE_VERTEX` by default, where transforms are applied to the vertices of objects drawn to the canvas, but `Poyo.MODE_TEXTURE` applies transforms to textures.

The two modes can be used to achieve interesting effects, such as an infinitely repeating background through one draw call:

```js
function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let transform_vertex = Poyo.createTransform();
  let transform_texture = Poyo.createTransform();

  // Get the draw target's dimensions.
  let t_w = Poyo.getTargetWidth();
  let t_h = Poyo.getTargetHeight();

  // Get the bitmap's dimensions.
  let b_w = Poyo.getBitmapWidth(bitmap);
  let b_h = Poyo.getBitmapHeight(bitmap);

  // Save transforms to be later restored.
  Poyo.saveTransform(transform_vertex);
  Poyo.saveTransform(transform_texture);

  // Scale vertices up to fill target.
  // Note that setting the transform mode here is unnecessary, as
  // the transform mode is set to Poyo.MODE_VERTEX by default.
  Poyo.scaleTransform(transform_vertex, t_w / b_w, t_h / b_h);
  Poyo.useTransform(transform_vertex);

  // Apply future transforms to textures rather than vertices.
  Poyo.setTransformMode(Poyo.MODE_TEXTURE);

  // Animate the texture like a scrolling background.
  Poyo.translateTransform(transform_texture, Poyo.getTime() * 32, Poyo.getTime() * 32);

  // Scale texture down to retain resolution within scaled-up geometry.
  Poyo.scaleTransform(transform_texture, b_w / t_w, b_h / t_h);

  // Apply the texture transform.
  Poyo.useTransform(transform_texture);

  // Draw the bitmap. Its vertices are now scaled-up to fill the draw target,
  // but its texture is scaled-down to retain its native resolution. All the
  // while, the texture is scrolling diagonally, repeating indefinitely
  // (assumes default bitmap flag of Poyo.WRAP_REPEAT).
  Poyo.drawBitmap(bitmap, 0, 0);

  // Restore texture transform so as not to apply it to other draw calls.
  Poyo.restoreTransform(transform_texture);

  // Restore vertex transform so as not to apply the scaling to other draw calls.
  Poyo.restoreTransform(transform_vertex);

  // Set the transform mode back to Poyo.MODE_VERTEX, the default.
  Poyo.setTransformMode(Poyo.MODE_VERTEX);
}
```

---

**Poyo.getTransformMode()**

```js
Poyo.getTransformMode()
```

Returns the current transform mode, either `Poyo.MODE_VERTEX` (default) or `Poyo.MODE_TEXTURE`.

---

**Poyo.useTransform()**

```js
Poyo.useTransform(transform)
```

Applies the given `transform` to future drawing routines.

```js
function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let transform = Poyo.createTransform();

  // Translate, rotate, scale, shear, et cetera...

  // Use the transformation.
  Poyo.useTransform(transform);

  // Draw here...
}
```

---

**Poyo.translateTransform()**

```js
Poyo.translateTransform(transform, translate_x, translate_y)
```

Translates (moves) the origin of the given `transform` by `translate_x` and `translate_y` in pixel space.

```js
let transform = Poyo.createTransform();

// Move right 30 pixels and down 50 pixels.
Poyo.translateTransform(transform, 30, 50);

// Apply the transformation to future drawing routines.
Poyo.useTransform(transform);
```

---

**Poyo.scaleTransform()**

```js
Poyo.scaleTransform(transform, scale_x, scale_y)
```

Scales the given `transform` by a factor of `scale_x` and `scale_y`.

```js
let transform = Poyo.createTransform();

// Make future drawing calls be twice as wide and thrice as tall.
Poyo.scaleTransform(transform, 2, 3);

Poyo.useTransform(transform);
```

---

**Poyo.rotateTransform()**

```js
Poyo.rotateTransform(transform, theta)
```

Rotates the given `transform` on its origin by `theta` radians clock-wise.

```js
let transform = Poyo.createTransform();

// Rotate the origin by pi.
Poyo.rotateTransform(transform, Math.PI);

Poyo.useTransform(transform);
```

---

**Poyo.shearTransform()**

```js
Poyo.shearTransform(transform, theta_x, theta_y)
```

Shears the given `transform` by `theta_x` and `theta_y`.

---

**Poyo.saveTransform()**

```js
Poyo.saveTransform(transform)
```

Saves the given `transform` by pushing it onto Poyo's matrix stack.

---

**Poyo.restoreTransform()**

```js
Poyo.restoreTransform(transform)
```

Pops the given `transform` from Poyo's matrix stack, and uses `transform`'s value from when `Poyo.saveTransform()` was called.

```js
function render() {

  // ...

  let transform = Poyo.createTransform();

  // Move right by 30 pixels and down by 50 pixels.
  Poyo.translateTransform(transform, 30, 50);

  // Save the transformation in its current state.
  Poyo.saveTransform(transform);

  Poyo.useTransform(transform);

  // Draw stuff here with the transformation applied...

  // Scale everything by a factor of 2 on both axes.
  Poyo.scaleTransform(transform, 2, 2);

  Poyo.useTransform(transform);

  // Draw more stuff here now using the scale applied to the translation...

  // Restore the transformation at its translation-only state.
  Poyo.restoreTransform(transform);

  // Draw more stuff here without the scaling applied...
}
```

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

---

## Shaders

A `shader` is a small program that is executed by the GPU. Fundamentally, a vertex shader and a fragment shader are required to produce a shader program. Poyo offers a few methods to aid in creating shaders.

---

**Poyo.getContext()**

```js
Poyo.getContext()
```

Returns a `WebGL2` context, which can be used to interface with the WebGL 2 API.

---

**Poyo.createShader()**

```js
Poyo.createShader(source, type)
```

Attempts to create a shader from the given `source` of the given `type`. The `type` can be `WebGL2.VERTEX_SHADER` or `WebGL2.FRAGMENT_SHADER`. This method returns a compiled shader object upon success, or `false` on failure.

```js
// Get the WebGL 2 context.
let WebGL2 = Poyo.getContext();

let fragment_shader_source = `

  #version 300 es

  precision mediump float;

  out vec4 output_color;

  void main(void) {

    output_color = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;

let fragment_shader = Poyo.createShader(fragment_shader_source, WebGL2.FRAGMENT_SHADER);

if (!fragment_shader) {

  // Error...
}
```

---

**Poyo.createProgram()**

```js
Poyo.createProgram(vertex_shader, fragment_shader)
```

Links compiled `vertex_shader` and `fragment_shader` and returns a shader program upon success, or `false` on failure.

```js
// Get the WebGL 2 context.
let WebGL2 = Poyo.getContext();

// Define shader sources.
let vertex_shader_source = "...";
let fragment_shader_source = "...";

// Compile shaders.
let vertex_shader = Poyo.createShader(vertex_shader_source, WebGL2.VERTEX_SHADER);
let fragment_shader = Poyo.createShader(fragment_shader_source, WebGL2.FRAGMENT_SHADER);

if (!vertex_shader || !fragment_shader) {

  // Error...
}

// Link the shaders into a program.
let program = Poyo.createProgram(vertex_shader, fragment_shader);

if (!program) {

  // Error...
}

// Use the program.
WebGL2.useProgram(program);

// ...
```

---

## Miscellaneous

Here are some other methods that don't quite fit into their own categories.

---

**Poyo.initialize()**

```js
Poyo.initialize(canvas_width, canvas_height)
```

Initializes the library and sets the canvas' dimensions to `canvas_width` and `canvas_height` in pixels. It returns `true` upon success, or `false` upon failure. This method must be called before most of the library's other methods and properties can be used.

---

**Poyo.getErrors()**

```js
Poyo.getErrors()
```

Returns an array of errors collected during initialization.

```js
if (!Poyo.initialize(768, 432)) {

  Poyo.getErrors().forEach(

    (error) => {

      // Cycle through the errors.
      Poyo.displayError(error);
    }
  );
}
```

---

**Poyo.displayError()**

```js
Poyo.displayError(message)
```

Produces an alert with the message of `message`, and throws an error to kill the script. This should be used when catastrophic errors occur, like during initialization failure or when resources fail to load.

---

**Poyo.getVersion()**

```js
Poyo.getVersion()
```

Returns a number representing the library's version.

---

**Poyo.getTime()**

```js
Poyo.getTime()
```

Returns the number of seconds elapsed since `Poyo.initialize()` was called.

---

**Poyo.getCanvas()**

```js
Poyo.getCanvas()
```

Returns a reference to the HTML canvas element. This is equivalent to `document.getElementById("poyo")`.

---

**Poyo.getCanvasWidth()**

```js
Poyo.getCanvasWidth()
```

Returns the width of the canvas in pixels.

---

**Poyo.getCanvasHeight()**

```js
Poyo.getCanvasHeight()
```

Returns the height of the canvas in pixels.

---

**Poyo.setCanvasWidth()**

```js
Poyo.setCanvasWidth(width)
```

Sets the canvas' width to `width` in pixels.

---

**Poyo.setCanvasHeight()**

```js
Poyo.setCanvasHeight(height)
```

Sets the canvas' height to `height` in pixels.

---

**Poyo.resizeCanvas()**

```js
Poyo.resizeCanvas(width, height)
```

Resizes the canvas to `width` and `height` in pixels. This is equivalent to:

```js
Poyo.setCanvasWidth(width);
Poyo.setCanvasHeight(height);
```

---

**Poyo.getTargetWidth()**

```js
Poyo.getTargetWidth()
```

Returns the current draw target's width in pixels.

---

**Poyo.getTargetHeight()**

```js
Poyo.getTargetHeight()
```

Returns the current draw target's height in pixels.

---

**Poyo.createGameLoop()**

```js
Poyo.createGameLoop(loop_procedure)
```

Sets the function to be called 60 times per second as the game-loop.

```js
function main() {

  // ...

  Poyo.createGameLoop(loop);
}

function loop() {

  // Update and render here...
}
```

---

**Poyo.setEntryPoint()**

```js
Poyo.setEntryPoint(function_name)
```

Invokes `function_name` once the window has finished loading.
