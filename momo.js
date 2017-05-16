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

    // These define keyboard key codes.
    this.KEY_BACKSPACE = 8;
    this.KEY_TAB = 9;
    this.KEY_ENTER = 13;
    this.KEY_SHIFT = 16;
    this.KEY_CTRL = 17;
    this.KEY_ALT = 18;
    this.KEY_PAUSEBREAK = 19;
    this.KEY_CAPSLOCK = 20;
    this.KEY_ESCAPE = 27;
    this.KEY_SPACE = 32;
    this.KEY_PAGEUP = 33;
    this.KEY_PAGEDOWN = 34;
    this.KEY_END = 35;
    this.KEY_HOME = 36;
    this.KEY_LEFT = 37;
    this.KEY_UP = 38;
    this.KEY_RIGHT = 39;
    this.KEY_DOWN = 40;
    this.KEY_INSERT = 45;
    this.KEY_DELETE = 46;
    this.KEY_0 = 48;
    this.KEY_1 = 49;
    this.KEY_2 = 50;
    this.KEY_3 = 51;
    this.KEY_4 = 52;
    this.KEY_5 = 53;
    this.KEY_6 = 54;
    this.KEY_7 = 55;
    this.KEY_8 = 56;
    this.KEY_9 = 57;
    this.KEY_A = 65;
    this.KEY_B = 66;
    this.KEY_C = 67;
    this.KEY_D = 68;
    this.KEY_E = 69;
    this.KEY_F = 70;
    this.KEY_G = 71;
    this.KEY_H = 72;
    this.KEY_I = 73;
    this.KEY_J = 74;
    this.KEY_K = 75;
    this.KEY_L = 76;
    this.KEY_M = 77;
    this.KEY_N = 78;
    this.KEY_O = 79;
    this.KEY_P = 80;
    this.KEY_Q = 81;
    this.KEY_R = 82;
    this.KEY_S = 83;
    this.KEY_T = 84;
    this.KEY_U = 85;
    this.KEY_V = 86;
    this.KEY_W = 87;
    this.KEY_X = 88;
    this.KEY_Y = 89;
    this.KEY_Z = 90;
    this.KEY_LMETA = 91;
    this.KEY_RMETA = 92;
    this.KEY_SELECT = 93;
    this.KEY_PAD_0 = 96;
    this.KEY_PAD_1 = 97;
    this.KEY_PAD_2 = 98;
    this.KEY_PAD_3 = 99;
    this.KEY_PAD_4 = 100;
    this.KEY_PAD_5 = 101;
    this.KEY_PAD_6 = 102;
    this.KEY_PAD_7 = 103;
    this.KEY_PAD_8 = 104;
    this.KEY_PAD_9 = 105;
    this.KEY_MULTIPLY = 106;
    this.KEY_ADD = 107;
    this.KEY_SUBTRACT = 109;
    this.KEY_DIVIDE = 111;
    this.KEY_F1 = 112;
    this.KEY_F2 = 113;
    this.KEY_F3 = 114;
    this.KEY_F4 = 115;
    this.KEY_F5 = 116;
    this.KEY_F6 = 117;
    this.KEY_F7 = 118;
    this.KEY_F8 = 119;
    this.KEY_F9 = 120;
    this.KEY_F10 = 121;
    this.KEY_F11 = 122;
    this.KEY_F12 = 123;
    this.KEY_NUMLOCK = 144;
    this.KEY_SCROLLLOCK = 145;
    this.KEY_SEMICOLON = 186;
    this.KEY_EQUALS = 187;
    this.KEY_COMMA = 188;
    this.KEY_DASH = 189;
    this.KEY_PERIOD = 190;
    this.KEY_FORWARDSLASH = 191;
    this.KEY_TILDE = 192;
    this.KEY_OPENBRACE = 219;
    this.KEY_BACKSLASH = 220;
    this.KEY_CLOSEBRACE = 221;
    this.KEY_QUOTE = 222;
  }

  initialize() {

    let canvas = document.createElement("canvas");

    if (!!!(canvas && canvas.getContext("2d"))) {

      // The browser does not support the canvas element.
      return false;
    }

    // Listen for keyboard events.
    document.addEventListener("keyup", this.manageKeyboardEvents.bind(this));
    document.addEventListener("keydown", this.manageKeyboardEvents.bind(this));

    // Set the time in which the library was initialized.
    this.time_initialized = Date.now();

    return true;
  }

  getTime() {

    // Get the number of seconds elapsed since the library was initialized.
    return ((Date.now() - this.time_initialized) / 1000).toFixed(6);
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

  isMouseButtonUp(button) {

    return !this.mouse_button[button];
  }

  isMouseButtonDown(button) {

    return this.mouse_button[button];
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

  isKeyUp(key_code) {

    return !this.key[key_code];
  }

  isKeyDown(key_code) {

    return this.key[key_code];
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

    // Listen for mouse events.
    canvas.addEventListener("wheel", this.manageMouseEvents.bind(this));
    canvas.addEventListener("mouseup", this.manageMouseEvents.bind(this));
    canvas.addEventListener("mousedown", this.manageMouseEvents.bind(this));
    canvas.addEventListener("mousemove", this.manageMouseEvents.bind(this));
    canvas.addEventListener("contextmenu", this.manageMouseEvents.bind(this));

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

      if (this.resources[i].type == "sound") {

        // Check if sound files have completed loading.

        if (this.resources[i].element.readyState >= this.resources[i].element.HAVE_FUTURE_DATA) {

          // The sound files have loaded enough to begin being played.
          this.resources[i].ready = true;
        }
      }

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

    let font = {

      element: element,

      file: file_name,

      name: font_name,

      type: "font"
    };

    // Pre-load font.
    this.drawText(font, this.makeColor(0, 0, 0, 0), 0, 0, 0, this.TEXT_ALIGN_LEFT, "");

    return font;
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

  loadSound(file_name) {

    let element = document.createElement("audio");

    if (!!!element.canPlayType("audio/" + file_name.split(".").pop())) {

      // The browser can not play this audio format.
      return false;
    }

    element.src = file_name;

    let sound = {

      element: element,

      file: file_name,

      volume: 1.0,

      ready: false,

      type: "sound"
    };

    this.resources.push(sound);

    element.onloadeddata = function() {

      if (!sound.ready) {

        sound.ready = true;
      }
    };

    return sound;
  }

  playSound(sound, volume, speed, loop) {

    sound.volume = volume;

    sound.element.loop = loop;
    sound.element.volume = volume;
    sound.element.playbackRate = speed;

    sound.element.play();
  }

  stopSound(sound) {

    sound.element.pause();

    sound.element.currentTime = 0;
  }

  pauseSound(sound) {

    sound.element.pause();
  }

  resumeSound(sound) {

    sound.element.play();
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

  drawPolygon(points, color, thickness, join) {

    this.setStrokeAndFillStyle(color, thickness);

    let x = [];
    let y = [];

    for (let i = 0; i < points.length; ++i) {

      if (i % 2) {

        y.push(points[i]);
      }
      else {

        x.push(points[i]);
      }
    }

    this.canvas.context.beginPath();

    for (let i = 0; i < x.length; ++i) {

      if (i == 0) {

        this.canvas.context.moveTo(x[i], y[i]);

        continue;
      }

      this.canvas.context.lineTo(x[i], y[i]);
    }

    if (join) {

      this.canvas.context.closePath();
    }

    this.canvas.context.stroke();
  }

  drawFilledPolygon(points, color) {

    this.setStrokeAndFillStyle(color);

    let x = [];
    let y = [];

    for (let i = 0; i < points.length; ++i) {

      if (i % 2) {

        y.push(points[i]);
      }
      else {

        x.push(points[i]);
      }
    }

    this.canvas.context.beginPath();

    for (let i = 0; i < x.length; ++i) {

      if (i == 0) {

        this.canvas.context.moveTo(x[i], y[i]);

        continue;
      }

      this.canvas.context.lineTo(x[i], y[i]);
    }

    this.canvas.context.closePath();

    this.canvas.context.fill();
  }

  drawLine(begin_x, begin_y, end_x, end_y, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(begin_x, begin_y);
    this.canvas.context.lineTo(end_x, end_y);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawPixel(x, y, color) {

    this.drawFilledRectangle(x, y, x + 1, y + 1, color);
  }

  drawArc(center_x, center_y, radius, start_angle, end_angle, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawFilledArc(center_x, center_y, radius, start_angle, end_angle, color) {

    this.setStrokeAndFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }

  drawCircle(center_x, center_y, radius, color, thickness) {

    this.drawArc(center_x, center_y, radius, 0, 2 * Math.PI, color, thickness);
  }

  drawFilledCircle(center_x, center_y, radius, color) {

    this.drawFilledArc(center_x, center_y, radius, 0, 2 * Math.PI, color);
  }

  drawEllipse(center_x, center_y, radius_x, radius_y, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.canvas.context.beginPath();
    this.canvas.context.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, 2 * Math.PI);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawFilledEllipse(center_x, center_y, radius_x, radius_y, color) {

    this.setStrokeAndFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, 2 * Math.PI);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }

  drawRectangle(begin_x, begin_y, end_x, end_y, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.canvas.context.beginPath();
    this.canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawFilledRectangle(begin_x, begin_y, end_x, end_y, color) {

    this.setStrokeAndFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }

  drawTriangle(x1, y1, x2, y2, x3, y3, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(x1, y1);
    this.canvas.context.lineTo(x2, y2);
    this.canvas.context.lineTo(x3, y3);
    this.canvas.context.closePath();
    this.canvas.context.stroke();
  }

  drawFilledTriangle(x1, y1, x2, y2, x3, y3, color) {

    this.setStrokeAndFillStyle(color);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(x1, y1);
    this.canvas.context.lineTo(x2, y2);
    this.canvas.context.lineTo(x3, y3);
    this.canvas.context.closePath();
    this.canvas.context.fill();
  }
}
