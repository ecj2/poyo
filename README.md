# Momo

Momo is a minimal 2D game library written in JavaScript.

## Fonts

These methods and members are used to load fonts and draw text.

```js
Momo.TEXT_ALIGN_LEFT
Momo.TEXT_ALIGN_RIGHT
Momo.TEXT_ALIGN_CENTER
Momo.loadFont(file_name)
Momo.drawText(font, color, size, x, y, alignment, text, outline_color, outline_width)
```

## Mouse

These methods and members are used to interface with the mouse.

```js
Momo.MOUSE_BUTTON_LEFT
Momo.MOUSE_BUTTON_RIGHT
Momo.MOUSE_BUTTON_MIDDLE
Momo.getMouseX()
Momo.getMouseY()
Momo.getMouseZ()
Momo.hideMouseCursor()
Momo.showMouseCursor()
Momo.isMouseButtonPressed(button)
Momo.isMouseButtonReleased(button)
```

## Colors

These methods are used to create integer RGBA color values.

```js
Momo.makeColor(r, g, b, a)
```

## Canvas

These methods are used to interact with the canvas.

```js
Momo.setCanvas(canvas_id, canvas_width, canvas_height)
Momo.clearCanvas(color)
Momo.getCanvasWidth()
Momo.getCanvasHeight()
```

## Images

These methods are used to load and draw images.

```js
Momo.loadImage(file_name)
Momo.drawImage(image, x, y)
Momo.getImageWidth(image)
Momo.getImageHeight(image)
Momo.drawScaledImage(image, x, y, scale_width, scale_height)
Momo.drawPartialImage(image, start_x, start_y, width, height, x, y)
Momo.drawRotatedImage(image, center_x, center_y, draw_x, draw_y, angle)
```

## Keyboard

These methods are used to detect keyboard events.

```js
Momo.isKeyPressed(key_code)
Momo.isKeyReleased(key_code)
```

## Primitives

These methods are used to draw various shapes.

```js
Momo.drawArc(center_x, center_y, radius, start_angle, end_angle, fill_color, outline_color, outline_width)
Momo.drawLine(begin_x, begin_y, end_x, end_y, outline_color, outline_width)
Momo.drawCircle(center_x, center_y, radius, fill_color, outline_color, outline_width)
Momo.drawTriangle(x1, y1, x2, y2, x3, y3, fill_color, outline_color, outline_width)
Momo.drawRectangle(begin_x, begin_y, end_x, end_y, fill_color, outline_color, outline_width)
```

## Miscellaneous

These methods sport miscellaneous purposes.

```js
Momo.getTime()
Momo.initialize()
Momo.setFrameRate(frame_rate)
Momo.getFrameRate()
Momo.resourcesLoaded(procedure)
Momo.createLoop(procedure)
Momo.loadFunction(function_name)
```
