# Kinoko

Kinoko is a minimal game library written in JavaScript.


## Colors

These methods are used to create integer RGBA color values.

```js
Kinoko.makeColor(r, g, b, a)
```

## Canvas

These methods are used to interact with the canvas.

```js
Kinoko.setCanvas(canvas_id, canvas_width, canvas_height)
Kinoko.clearCanvas(color)
Kinoko.getCanvasWidth()
Kinoko.getCanvasHeight()
```

## Primitives

These methods are used to draw various shapes.

```js
Kinoko.drawArc(center_x, center_y, radius, start_angle, end_angle, color, line_width)
Kinoko.drawLine(begin_x, begin_y, end_x, end_y, color, line_width)
Kinoko.drawCircle(center_x, center_y, radius, color, line_width)
Kinoko.drawTriangle(x1, y1, x2, y2, x3, y3, color, line_width)
Kinoko.drawRectangle(begin_x, begin_y, end_x, end_y, color, line_width)
Kinoko.drawFilledArc(center_x, center_y, radius, start_angle, end_angle, color)
Kinoko.drawFilledCircle(center_x, center_y, radius, color)
Kinoko.drawFilledTriangle(x1, y1, x2, y2, x3, y3, color)
Kinoko.drawFilledRectangle(begin_x, begin_y, end_x, end_y, color)
```

## Miscellaneous

These methods sport miscellaneous purposes.

```js
Kinoko.initialize()
Kinoko.setFrameRate(frame_rate)
Kinoko.getFrameRate()
Kinoko.resourcesLoaded(procedure)
Kinoko.createLoop(procedure)
Kinoko.loadFunction(function_name)
```
