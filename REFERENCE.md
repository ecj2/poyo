# Poyo Reference

Welcome to Poyo's reference document. This document briefly details the library's core methods and functionality.

---

## Colors

Colors are used to clear draw targets, tint bitmaps, and shade text.

**Poyo.createColor()**

```js
Poyo.createColor(r, g, b, a)
```

Returns an object literal containing color values. Each channel ranges from 0 to 255, with `a` representing an optional alpha.

```js
let blue = Poyo.createColor(0, 0, 255);
let translucent_yellow = Poyo.createColor(255, 255, 0, 128);
```

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

    // Error.
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
// Set future drawing to take place on bitmap rathern than the canvas.
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
