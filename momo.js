var Momo = new class {

  constructor() {

    // Everything is drawn on this canvas.
    this.canvas = undefined;

    // Resources are be queued here.
    this.resources = [];

    // This dictates how often the canvas should be updated.
    this.frame_rate = 0;

    // These dictate how text should be aligned when drawn.
    this.TEXT_ALIGN_LEFT = 0;
    this.TEXT_ALIGN_RIGHT = 1;
    this.TEXT_ALIGN_CENTER = 2;

    // These store which keys are pressed and released.
    this.key = [];
    this.pressed = [];
    this.released = [];
  }

  initialize() {

    var canvas = document.createElement("canvas");

    if (!!!(canvas && canvas.getContext("2d"))) {

      // The browser does not support the canvas element.
      return false;
    }

    // Listen for keyboard events.
    document.addEventListener("keyup", this.manageKeyboard);
    document.addEventListener("keydown", this.manageKeyboard);

    return true;
  }

  manageKeyboard(event) {

    switch (event.type) {

      case "keyup":

        window.Momo.key[event.which] = false;

        window.Momo.released[event.which] = true;
      break;

      case "keydown":

        if (!window.Momo.key[event.which]) {

          window.Momo.pressed[event.which] = true;
        }

        window.Momo.key[event.which] = true;
      break;
    }

    event.preventDefault();
  }

  keyDown(key_code) {

    return this.key[key_code];
  }

  keyPressed(key_code) {

    return this.pressed[key_code];
  }

  keyReleased(key_code) {

    return this.released[key_code];
  }

  setCanvas(canvas_id, canvas_width, canvas_height) {

    // Get the specified canvas element.
    var canvas = document.getElementById(canvas_id);

    if (!!!canvas) {

      // The specified canvas element does not exist.
      return false;
    }

    // Set the dimensions of the canvas.
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    // Set the dimensions, elements, and contexts of the member canvas.
    this.canvas = {

      width: canvas_width,

      height: canvas_height,

      canvas: canvas,

      context: canvas.getContext("2d"),

      ready: true
    };

    return true;
  }

  clearCanvas(color) {

    this.setStrokeFillStyle(color);

    this.canvas.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getCanvasWidth() {

    return this.canvas.width;
  }

  getCanvasHeight() {

    return this.canvas.height;
  }

  setFrameRate(frame_rate) {

    this.frame_rate = frame_rate;
  }

  getFrameRate() {

    return this.frame_rate;
  }

  resourcesLoaded(procedure) {

    var number_of_resources = 0;
    var number_of_resources_loaded = 0;

    for (var i = 0; i < window.Momo.resources.length; ++i) {

      ++number_of_resources;

      if (window.Momo.resources[i].ready) {

        ++number_of_resources_loaded;
      }
    }

    if (number_of_resources_loaded < number_of_resources) {

      // Some resources have not completed downloading yet.
      window.setTimeout(window.Momo.resourcesLoaded, 100, procedure);
    }
    else {

      // All of the resources have completed downloading.
      procedure();
    }
  }

  createLoop(procedure) {

    window.setInterval(

      function() {

        procedure();

        for (var i = 0; i < window.Momo.key.length; ++i) {

          // Clear key arrays so each keyboard event fires only once.
          window.Momo.pressed[i] = false;
          window.Momo.released[i] = false;
        }
      },

      1000 / this.frame_rate
    );
  }

  makeColor(r, g, b, a = 255) {

    return {r: r, g: g, b: b, a: a};
  }

  setStrokeFillStyle(color, line_width = 0) {

    var r = color.r;
    var g = color.g;
    var b = color.b;
    var a = color.a / 255.0;

    this.canvas.context.lineWidth = line_width;
    this.canvas.context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    this.canvas.context.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }

  loadFunction(function_name) {

    // Call the specified function when the window loads.
    window.addEventListener("load", function_name);
  }

  loadFont(file_name) {

    var element = document.createElement("style");

    var font_name = "font_" + Math.random().toString(16).slice(2);

    element.textContent = `

      @font-face {

        font-family: ` + font_name + `;
        src: url("` + file_name + `");
      }
    `;

    document.head.appendChild(element);

    return {

      element: element,

      file: file_name,

      name: font_name,

      type: "font"
    }
  }

  drawText(font, color, size, x, y, alignment, text) {

    this.setStrokeFillStyle(color, 0);

    switch (alignment) {

      case this.TEXT_ALIGN_LEFT:

        this.canvas.context.textAlign = "left";
      break;

      case this.TEXT_ALIGN_CENTER:

        this.canvas.context.textAlign = "center";
      break;

      case this.TEXT_ALIGN_RIGHT:

        this.canvas.context.textAlign = "right";
      break;
    }

    this.canvas.context.font = size + "px " + font.name;

    this.canvas.context.fillText(text, x, y + size);
  }

  drawOutlinedText(font, color, size, line_width, x, y, alignment, text) {

    this.setStrokeFillStyle(color, line_width);

    switch (alignment) {

      case this.TEXT_ALIGN_LEFT:

        this.canvas.context.textAlign = "left";
      break;

      case this.TEXT_ALIGN_CENTER:

        this.canvas.context.textAlign = "center";
      break;

      case this.TEXT_ALIGN_RIGHT:

        this.canvas.context.textAlign = "right";
      break;
    }

    this.canvas.context.textBaseline = "top";

    this.canvas.context.font = size + "px " + font.name;

    this.canvas.context.strokeText(text, x, y);
  }

  loadImage(file_name) {

    var element = new Image();

    element.src = file_name;

    var sub_canvas = document.createElement("canvas");
    var sub_canvas_context = sub_canvas.getContext("2d");

    var image = {

      canvas: sub_canvas,

      context: sub_canvas_context,

      width: -1,

      height: -1,

      ready: false,

      type: "image"
    };

    this.resources.push(image);

    element.onload = function() {

      image.canvas.width = element.width;
      image.canvas.height = element.height;

      image.context.drawImage(element, 0, 0);

      image.width = element.width;
      image.height = element.height;

      image.ready = true;
    }

    return image;
  }

  getImageWidth(image) {

    return image.width;
  }

  getImageHeight(image) {

    return image.height;
  }

  drawImage(image, x, y) {

    this.canvas.context.drawImage(image.canvas, x, y);
  }

  drawScaledImage(image, x, y, scale_width, scale_height) {

    this.canvas.context.save();

    this.canvas.context.translate(x, y);
    this.canvas.context.scale(scale_width, scale_height);

    this.drawImage(image, 0, 0);

    this.canvas.context.restore();
  }

  drawPartialImage(image, start_x, start_y, width, height, x, y) {

    this.canvas.context.save();

    this.canvas.context.drawImage(image.canvas, start_x, start_y, width, height, x, y, width, height);

    this.canvas.context.restore();
  }

  drawRotatedImage(image, center_x, center_y, draw_x, draw_y, angle) {

    this.canvas.context.save();

    this.canvas.context.translate(draw_x + center_x, draw_y + center_y);
    this.canvas.context.rotate(angle);

    this.drawImage(image, -center_x, -center_y);

    this.canvas.context.restore();
  }

  drawArc(center_x, center_y, radius, start_angle, end_angle, color, line_width) {

    this.setStrokeFillStyle(color, line_width);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawLine(begin_x, begin_y, end_x, end_y, color, line_width) {

    this.setStrokeFillStyle(color, line_width);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(begin_x, begin_y);
    this.canvas.context.lineTo(end_x, end_y);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawCircle(center_x, center_y, radius, color, line_width) {

    this.setStrokeFillStyle(color, line_width);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, 0, 2 * Math.PI);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawFilledCircle(center_x, center_y, radius, color) {

    this.setStrokeFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, 0, 2 * Math.PI);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }

  drawRectangle(begin_x, begin_y, end_x, end_y, color, line_width) {

    this.setStrokeFillStyle(color, line_width);

    this.canvas.context.beginPath();
    this.canvas.context.strokeRect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.canvas.context.closePath();
  }

  drawFilledArc(center_x, center_y, radius, start_angle, end_angle, color) {

    this.setStrokeFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }

  drawFilledRectangle(begin_x, begin_y, end_x, end_y, color) {

    this.setStrokeFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.fillRect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.canvas.context.closePath();
  }

  drawTriangle(x1, y1, x2, y2, x3, y3, color, line_width) {

    this.setStrokeFillStyle(color, line_width);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(x1, y1);
    this.canvas.context.lineTo(x2, y2);
    this.canvas.context.lineTo(x3, y3);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawFilledTriangle(x1, y1, x2, y2, x3, y3, color) {

    this.setStrokeFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(x1, y1);
    this.canvas.context.lineTo(x2, y2);
    this.canvas.context.lineTo(x3, y3);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }
}
