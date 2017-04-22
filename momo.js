var Momo = new class {

  constructor() {

    // Everything is drawn on this canvas.
    this.canvas = undefined;

    // Resources are queued here.
    this.resources = [];

    // This dictates how often the canvas should be updated.
    this.frame_rate = undefined;

    // These dictate how text should be aligned when drawn.
    this.TEXT_ALIGN_LEFT = 0;
    this.TEXT_ALIGN_RIGHT = 1;
    this.TEXT_ALIGN_CENTER = 2;

    // These store information pertaining to mouse axes.
    this.mouse_x = 0;
    this.mouse_y = 0;
    this.mouse_z = 0;

    // These store information pertaining to mouse buttons.
    this.mouse_button = [];
    this.mouse_button_pressed = [];
    this.mouse_button_released = [];

    // These define mouse buttons.
    this.MOUSE_BUTTON_LEFT = 0;
    this.MOUSE_BUTTON_RIGHT = 2;
    this.MOUSE_BUTTON_MIDDLE = 1;

    // These store which keys are pressed and released.
    this.key = [];
    this.key_pressed = [];
    this.key_released = [];

    // The time in which the library was initialized is stored here.
    this.time_initialized = undefined;
  }

  initialize() {

    let canvas = document.createElement("canvas");

    if (!!!(canvas && canvas.getContext("2d"))) {

      // The browser does not support the canvas element.
      return false;
    }

    // Listen for mouse events.
    document.addEventListener("wheel", this.manageMouseEvents.bind(this));
    document.addEventListener("mouseup", this.manageMouseEvents.bind(this));
    document.addEventListener("mousedown", this.manageMouseEvents.bind(this));
    document.addEventListener("mousemove", this.manageMouseEvents.bind(this));
    document.addEventListener("contextmenu", this.manageMouseEvents.bind(this));

    // Listen for keyboard events.
    document.addEventListener("keyup", this.manageKeyboardEvents.bind(this));
    document.addEventListener("keydown", this.manageKeyboardEvents.bind(this));

    // Set the time in which the library was initialized.
    this.time_initialized = (new Date()).getTime();

    return true;
  }

  getTime() {

    // Get the number of seconds elapsed since the library was initialized.
    return (((new Date()).getTime() - this.time_initialized) / 1000).toFixed(6);
  }

  manageMouseEvents(event) {

    switch (event.type) {

      case "wheel":

        this.mouse_z = event.deltaY;
      break;

      case "mouseup":

        this.mouse_button[event.button] = false;
        this.mouse_button_released[event.button] = true;
      break;

      case "mousedown":

        if (!this.mouse_button[event.button]) {

          this.mouse_button_pressed[event.button] = true;
        }

        this.mouse_button[event.button] = true;
      break;

      case "mousemove":

        this.mouse_x = event.offsetX;
        this.mouse_y = event.offsetY;
      break;
    }

    event.preventDefault();
  }

  isMouseButtonPressed(button) {

    return this.mouse_button_pressed[button];
  }

  isMouseButtonReleased(button) {

    return this.mouse_button_released[button];
  }

  getMouseX() {

    return this.mouse_x;
  }

  getMouseY() {

    return this.mouse_y;
  }

  getMouseZ() {

    return this.mouse_z;
  }

  hideMouseCursor() {

    this.canvas.canvas.style.cursor = "none";
  }

  showMouseCursor() {

    this.canvas.canvas.style.cursor = "auto";
  }

  manageKeyboardEvents(event) {

    switch (event.type) {

      case "keyup":

        this.key[event.which] = false;
        this.key_released[event.which] = true;
      break;

      case "keydown":

        if (!this.key[event.which]) {

          this.key_pressed[event.which] = true;
        }

        this.key[event.which] = true;
      break;
    }

    event.preventDefault();
  }

  isKeyPressed(key_code) {

    return this.key_pressed[key_code];
  }

  isKeyReleased(key_code) {

    return this.key_released[key_code];
  }

  setCanvas(canvas_id, canvas_width, canvas_height) {

    // Get the specified canvas element.
    let canvas = document.getElementById(canvas_id);

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

    this.setStrokeAndFillStyle(color);

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

    let number_of_resources = 0;
    let number_of_resources_loaded = 0;

    for (let i = 0; i < this.resources.length; ++i) {

      ++number_of_resources;

      if (this.resources[i].ready) {

        ++number_of_resources_loaded;
      }
    }

    if (number_of_resources_loaded < number_of_resources) {

      // Some resources have not completed downloading yet.
      window.setTimeout(this.resourcesLoaded.bind(this), 100, procedure);
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

        // Reset mouse wheel position.
        this.mouse_z = 0;

        for (let i = 0; i < this.mouse_button.length; ++i) {

          // Clear mouse button arrays so each mouse button event fires only once.
          this.mouse_button[i] = false;
          this.mouse_button_pressed[i] = false;
          this.mouse_button_released[i] = false;
        }

        for (let i = 0; i < this.key.length; ++i) {

          // Clear key arrays so each keyboard event fires only once.
          this.key_pressed[i] = false;
          this.key_released[i] = false;
        }
      }.bind(this),

      1000 / this.frame_rate
    );
  }

  makeColor(r, g, b, a = 255) {

    return {r: r, g: g, b: b, a: a};
  }

  setStrokeAndFillStyle(color, line_width = 0) {

    let r = color.r;
    let g = color.g;
    let b = color.b;
    let a = color.a / 255.0;

    this.canvas.context.lineWidth = line_width;
    this.canvas.context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    this.canvas.context.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }

  loadFunction(function_name) {

    // Call the specified function when the window loads.
    window.addEventListener("load", function_name);
  }

  loadFont(file_name) {

    let element = document.createElement("style");

    let font_name = "font_" + Math.random().toString(16).slice(2);

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

  drawText(font, fill_color, size, x, y, alignment, text, outline_color = undefined, outline_width = 0) {

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

    this.setStrokeAndFillStyle(fill_color);

    this.canvas.context.fillText(text, x, y + size);

    if (outline_color != undefined && outline_width > 0) {

      this.setStrokeAndFillStyle(outline_color, outline_width);

      this.canvas.context.strokeText(text, x, y + size);
    }
  }

  loadImage(file_name) {

    let element = new Image();

    element.src = file_name;

    let sub_canvas = document.createElement("canvas");
    let sub_canvas_context = sub_canvas.getContext("2d");

    let image = {

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

  drawLine(begin_x, begin_y, end_x, end_y, outline_color, outline_width) {

    this.setStrokeAndFillStyle(outline_color, outline_width);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(begin_x, begin_y);
    this.canvas.context.lineTo(end_x, end_y);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawArc(center_x, center_y, radius, start_angle, end_angle, fill_color, outline_color = undefined, outline_width = 0) {

    this.setStrokeAndFillStyle(fill_color);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.canvas.context.closePath();
    this.canvas.context.fill();

    if (outline_color != undefined && outline_width > 0) {

      this.setStrokeAndFillStyle(outline_color, outline_width);

      this.canvas.context.stroke();
    }
  }

  drawCircle(center_x, center_y, radius, fill_color, outline_color = undefined, outline_width = 0) {

    this.setStrokeAndFillStyle(fill_color);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, 0, 2 * Math.PI);
    this.canvas.context.closePath();
    this.canvas.context.fill();

    if (outline_color != undefined && outline_width > 0) {

      this.setStrokeAndFillStyle(outline_color, outline_width);

      this.canvas.context.stroke();
    }
  }

  drawRectangle(begin_x, begin_y, end_x, end_y, fill_color, outline_color = undefined, outline_width = 0) {

    this.setStrokeAndFillStyle(fill_color);

    this.canvas.context.beginPath();
    this.canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.canvas.context.closePath();
    this.canvas.context.fill();

    if (outline_color != undefined && outline_width > 0) {

      this.setStrokeAndFillStyle(outline_color, outline_width);

      this.canvas.context.stroke();
    }
  }

  drawTriangle(x1, y1, x2, y2, x3, y3, fill_color, outline_color = undefined, outline_width = 0) {

    this.setStrokeAndFillStyle(fill_color);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(x1, y1);
    this.canvas.context.lineTo(x2, y2);
    this.canvas.context.lineTo(x3, y3);
    this.canvas.context.closePath();
    this.canvas.context.fill();

    if (outline_color != undefined && outline_width > 0) {

      this.setStrokeAndFillStyle(outline_color, outline_width);

      this.canvas.context.stroke();
    }
  }
}
