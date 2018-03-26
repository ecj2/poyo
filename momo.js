"use strict";

let Momo = new class {

  constructor() {

    this.main_canvas = undefined;
    this.target_canvas = undefined;

    this.frame_rate = undefined;

    this.key = [];
    this.key_codes = this.defineKeyCodes();
    this.key_pressed = [];
    this.key_released = [];

    this.mouse_x = 0;
    this.mouse_y = 0;
    this.mouse_z = 0;

    this.mouse_button = [];
    this.mouse_buttons = this.defineMouseButtons();
    this.mouse_button_pressed = [];
    this.mouse_button_released = [];

    this.mouse_focused = false;

    this.time_initialized = undefined;

    this.sample_instances = [];

    this.back_buffer = undefined;

    this.game_loop_procedure = undefined;
    this.game_loop_interval_identifier = undefined;

    this.mouse_method = this.manageMouseEvents.bind(this);
    this.keyboard_method = this.manageKeyboardEvents.bind(this);
  }

  initialize() {

    let canvas = document.createElement("canvas");

    if (!!!(canvas && canvas.getContext("2d"))) {

      // The browser does not support the canvas element.
      return false;
    }

    // Set the time in which the library was initialized.
    this.time_initialized = Date.now();

    return true;
  }

  getTime() {

    // Get the number of seconds elapsed since the library was initialized.
    return (Date.now() - this.time_initialized) / 1000;
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

      case "mouseout":

        this.mouse_focused = false;
      break;

      case "mouseover":

        this.mouse_focused = true;
      break;

      case "mousedown":

        if (!this.mouse_button[event.button]) {

          this.mouse_button_pressed[event.button] = true;
        }

        this.mouse_button[event.button] = true;
      break;

      case "mousemove":

        if (this.isMouseLocked()) {

          this.mouse_x += event.movementX;
          this.mouse_y += event.movementY;
        }
        else {

          this.mouse_x = event.offsetX;
          this.mouse_y = event.offsetY;
        }
      break;
    }

    if (event.type === "wheel" || event.which === 3) {

      event.preventDefault();
    }
  }

  defineKeyCodes() {

    return {

      "backspace": 8,

      "tab": 9,

      "enter": 13,

      "shift": 16,

      "ctrl": 17,

      "alt": 18,

      "pausebreak": 19,

      "capslock": 20,

      "escape": 27,

      "space": 32,

      "pageup": 33,

      "pagedown": 34,

      "end": 35,

      "home": 36,

      "left": 37,

      "up": 38,

      "right": 39,

      "down": 40,

      "insert": 45,

      "delete": 46,

      "0": 48,

      "1": 49,

      "2": 50,

      "3": 51,

      "4": 52,

      "5": 53,

      "6": 54,

      "7": 55,

      "8": 56,

      "9": 57,

      "a": 65,

      "b": 66,

      "c": 67,

      "d": 68,

      "e": 69,

      "f": 70,

      "g": 71,

      "h": 72,

      "i": 73,

      "j": 74,

      "k": 75,

      "l": 76,

      "m": 77,

      "n": 78,

      "o": 79,

      "p": 80,

      "q": 81,

      "r": 82,

      "s": 83,

      "t": 84,

      "u": 85,

      "v": 86,

      "w": 87,

      "x": 88,

      "y": 89,

      "z": 90,

      "lmeta": 91,

      "rmeta": 92,

      "select": 93,

      "pad_0": 96,

      "pad_1": 97,

      "pad_2": 98,

      "pad_3": 99,

      "pad_4": 100,

      "pad_5": 101,

      "pad_6": 102,

      "pad_7": 103,

      "pad_8": 104,

      "pad_9": 105,

      "multiply": 106,

      "add": 107,

      "subtract": 109,

      "divide": 111,

      "f1": 112,

      "f2": 113,

      "f3": 114,

      "f4": 115,

      "f5": 116,

      "f6": 117,

      "f7": 118,

      "f8": 119,

      "f9": 120,

      "f10": 121,

      "f11": 122,

      "f12": 123,

      "numlock": 144,

      "scrolllock": 145,

      "semicolon": 186,

      "equals": 187,

      "comma": 188,

      "dash": 189,

      "period": 190,

      "forwardslash": 191,

      "tilde": 192,

      "openbrace": 219,

      "backslash": 220,

      "closebrace": 221,

      "quote": 222
    };
  }

  defineMouseButtons() {

    return {

      "left": 0,

      "middle": 1,

      "right": 2
    };
  }

  installMouse() {

    this.main_canvas.canvas.addEventListener("wheel", this.mouse_method);
    this.main_canvas.canvas.addEventListener("mouseup", this.mouse_method);
    this.main_canvas.canvas.addEventListener("mouseout", this.mouse_method);
    this.main_canvas.canvas.addEventListener("mouseover", this.mouse_method);
    this.main_canvas.canvas.addEventListener("mousedown", this.mouse_method);
    this.main_canvas.canvas.addEventListener("mousemove", this.mouse_method);
    this.main_canvas.canvas.addEventListener("contextmenu", this.mouse_method);
  }

  uninstallMouse() {

    this.main_canvas.canvas.removeEventListener("wheel", this.mouse_method);
    this.main_canvas.canvas.removeEventListener("mouseup", this.mouse_method);
    this.main_canvas.canvas.removeEventListener("mouseout", this.mouse_method);
    this.main_canvas.canvas.removeEventListener("mouseover", this.mouse_method);
    this.main_canvas.canvas.removeEventListener("mousedown", this.mouse_method);
    this.main_canvas.canvas.removeEventListener("mousemove", this.mouse_method);
    this.main_canvas.canvas.removeEventListener("contextmenu", this.mouse_method);
  }

  isMouseFocused() {

    return this.mouse_focused;
  }

  isMouseButtonUp(button) {

    if (button === "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (!this.mouse_button[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.mouse_button[this.mouse_buttons[button]];
  }

  isMouseButtonDown(button) {

    if (button === "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse_button[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse_button[this.mouse_buttons[button]];
  }

  isMouseButtonPressed(button) {

    if (button === "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse_button_pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse_button_pressed[this.mouse_buttons[button]];
  }

  isMouseButtonReleased(button) {

    if (button === "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse_button_released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse_button_released[this.mouse_buttons[button]];
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

    this.main_canvas.canvas.style.cursor = "none";
  }

  showMouseCursor() {

    this.main_canvas.canvas.style.cursor = "auto";
  }

  isMouseCursorHidden() {

    return this.main_canvas.canvas.style.cursor === "none";
  }

  lockMouse() {

    this.main_canvas.canvas.requestPointerLock();
  }

  unlockMouse() {

    if (this.isMouseLocked()) {

      document.exitPointerLock();
    }
  }

  isMouseLocked() {

    return document.pointerLockElement === this.getCanvas();
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

  installKeyboard() {

    document.addEventListener("keyup", this.keyboard_method);
    document.addEventListener("keydown", this.keyboard_method);
  }

  uninstallKeyboard() {

    document.removeEventListener("keyup", this.keyboard_method);
    document.removeEventListener("keydown", this.keyboard_method);
  }

  isKeyUp(key_code) {

    if (key_code === "any") {

      if (this.key.length === 0) {

        // Assume that at least one key is up before any keyboard events are fired.
        return true;
      }

      let i = 0;

      let length = this.key.length;

      for (i; i < length; ++i) {

        if (!this.key[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.key[this.key_codes[key_code]];
  }

  isKeyDown(key_code) {

    if (key_code === "any") {

      let i = 0;

      let length = this.key.length;

      for (i; i < length; ++i) {

        if (this.key[i]) {

          return true;
        }
      }

      return false;
    }

    return this.key[this.key_codes[key_code]];
  }

  isKeyPressed(key_code) {

    if (key_code === "any") {

      let i = 0;

      let length = this.key_pressed.length;

      for (i; i < length; ++i) {

        if (this.key_pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.key_pressed[this.key_codes[key_code]];
  }

  isKeyReleased(key_code) {

    if (key_code === "any") {

      let i = 0;

      let length = this.key_released.length;

      for (i; i < length; ++i) {

        if (this.key_released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.key_released[this.key_codes[key_code]];
  }

  setCanvas(canvas_identifier, canvas_width, canvas_height) {

    let canvas = document.getElementById(canvas_identifier);

    if (!!!canvas) {

      // The specified canvas element does not exist.
      return false;
    }

    canvas.width = canvas_width;
    canvas.height = canvas_height;

    this.main_canvas = {

      width: canvas_width,

      height: canvas_height,

      canvas: canvas,

      context: canvas.getContext("2d")
    };

    // Set the main canvas as the default target canvas.
    this.setTargetCanvas(this.getCanvas());

    this.back_buffer = this.createBitmap(canvas_width, canvas_height);

    return true;
  }

  getCanvas() {

    return this.main_canvas.canvas;
  }

  getCanvasContext() {

    return this.main_canvas.context;
  }

  getBackBuffer() {

    // Draw the contents of the main canvas to the back-buffer bitmap.
    this.back_buffer.context.drawImage(this.main_canvas.canvas, 0, 0);

    return this.back_buffer;
  }

  clearCanvas(color) {

    this.setStrokeAndFillStyle(color);

    this.target_canvas.context.fillRect(0, 0, this.target_canvas.width, this.target_canvas.height);
  }

  resizeCanvas(width, height) {

    this.setCanvasWidth(width);
    this.setCanvasHeight(height);
  }

  setCanvasWidth(width) {

    this.main_canvas.width = width;
    this.main_canvas.canvas.width = width;

    if (this.getTargetCanvas() === this.getCanvas()) {

      this.target_canvas.width = width;
      this.target_canvas.canvas.width = width;
    }

    this.back_buffer = this.createBitmap(width, this.getBitmapHeight(this.back_buffer));
  }

  setCanvasHeight(height) {

    this.main_canvas.height = height;
    this.main_canvas.canvas.height = height;

    if (this.getTargetCanvas() === this.getCanvas()) {

      this.target_canvas.height = height;
      this.target_canvas.canvas.height = height;
    }

    this.back_buffer = this.createBitmap(this.getBitmapWidth(this.back_buffer), height);
  }

  getCanvasWidth() {

    return this.main_canvas.width;
  }

  getCanvasHeight() {

    return this.main_canvas.height;
  }

  setTargetCanvas(target_canvas) {

    this.target_canvas = {

      width: target_canvas.width,

      height: target_canvas.height,

      canvas: target_canvas,

      context: target_canvas.getContext("2d")
    };
  }

  getTargetCanvas() {

    return this.target_canvas.canvas;
  }

  getTargetCanvasContext() {

    return this.target_canvas.context;
  }

  getTargetCanvasWidth() {

    return this.target_canvas.width;
  }

  getTargetCanvasHeight() {

    return this.target_canvas.height;
  }

  scaleCanvas(scale_width, scale_height) {

    this.target_canvas.context.scale(scale_width, scale_height);
  }

  rotateCanvas(angle) {

    this.target_canvas.context.rotate(angle);
  }

  translateCanvas(x, y) {

    this.target_canvas.context.translate(x, y);
  }

  saveCanvasState() {

    this.target_canvas.context.save();
  }

  restoreCanvasState() {

    this.target_canvas.context.restore();
  }

  setFrameRate(frame_rate) {

    this.frame_rate = frame_rate;

    if (this.game_loop_interval_identifier !== undefined) {

      clearInterval(this.game_loop_interval_identifier);

      this.createLoop(this.game_loop_procedure);
    }
  }

  getFrameRate() {

    return this.frame_rate;
  }

  createLoop(procedure) {

    this.game_loop_procedure = procedure;

    this.game_loop_interval_identifier = setInterval(

      (() => {

        if (!document.hidden) {

          procedure();

          let i = 0;

          for (i; i < 3; ++i) {

            // Clear mouse button arrays so each mouse button event fires only once.
            this.mouse_button_pressed[i] = false;
            this.mouse_button_released[i] = false;
          }

          i = 0;

          length = this.key.length;

          for (i; i < length; ++i) {

            // Clear key arrays so each keyboard event fires only once.
            this.key_pressed[i] = false;
            this.key_released[i] = false;
          }
        }
      }).bind(this),

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

    this.target_canvas.context.lineWidth = line_width;
    this.target_canvas.context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    this.target_canvas.context.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }

  setEntryPoint(function_name) {

    // Call the specified function when the window loads.
    addEventListener("load", function_name);
  }

  setBlendMode(mode) {

    this.target_canvas.context.globalCompositeOperation = mode;
  }

  loadFont(file_name, style = "normal") {

    return fetch(file_name).then(

      (response) => {

        if (response.status === 200) {

          let element = document.createElement("style");
          let font_name = "font_" + Math.random().toString(16).slice(2);

          element.textContent = `

            @font-face {

              font-family: "` + font_name + `";
              src: url("` + file_name + `");
            }
          `;

          document.head.appendChild(element);

          return this.loadFontFace(font_name, style);
        }
        else {

          return false;
        }
      }
    );
  }

  loadFontFace(font_family_name, style = "normal") {

    let font = {

      name: font_family_name,

      style: style
    };

    // Pre-load the font.
    this.drawText(font, this.makeColor(0, 0, 0, 0), 0, 0, 0, "left", "");

    return font;
  }

  drawText(font, fill_color, size, x, y, alignment, text, outline_color = undefined, outline_width = 0) {

    this.target_canvas.context.textAlign = alignment;

    this.target_canvas.context.font = font.style + " " + size + "px " + font.name;

    this.setStrokeAndFillStyle(fill_color);

    this.target_canvas.context.fillText(text, x, y + size);

    if (outline_color !== undefined && outline_width > 0) {

      this.setStrokeAndFillStyle(outline_color, outline_width);

      this.target_canvas.context.strokeText(text, x, y + size);
    }
  }

  loadSample(file_name) {

    let element = document.createElement("audio");

    if (!!!element.canPlayType("audio/" + file_name.split(".").pop())) {

      // The browser can not play this audio format.
      return false;
    }

    element.src = file_name;

    let reject_function = undefined;
    let resolve_function = undefined;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let sample = {

            element: element
          };

          resolve(sample);
        };

        reject_function = () => {

          reject(false);
        };

        element.addEventListener("error", reject_function);
        element.addEventListener("canplaythrough", resolve_function);
      }
    ).then(

      (resolved) => {

        element.removeEventListener("error", reject_function);
        element.removeEventListener("canplaythrough", resolve_function);

        return resolved;
      },

      (rejected) => {

        element.removeEventListener("error", reject_function);
        element.removeEventListener("canplaythrough", resolve_function);

        return rejected;
      }
    );
  }

  playSample(sample, volume, speed, loop, identifier) {

    if (this.sample_instances[identifier] === undefined) {

      // Create a new instance of the sample.
      this.sample_instances[identifier] = sample.element.cloneNode();
    }

    if (!this.isSamplePlaying(identifier)) {

      this.adjustSample(identifier, volume, speed, loop);

      this.sample_instances[identifier].play();
    }
  }

  adjustSample(identifier, volume, speed, loop) {

    if (this.sample_instances[identifier] !== undefined) {

      this.sample_instances[identifier].loop = loop;
      this.sample_instances[identifier].volume = volume;
      this.sample_instances[identifier].playbackRate = speed;
    }
  }

  stopSample(identifier) {

    if (this.sample_instances[identifier] !== undefined) {

      if (this.isSamplePlaying(identifier)) {

        this.pauseSample(identifier);

        this.sample_instances[identifier].currentTime = 0;
      }
    }
  }

  pauseSample(identifier) {

    if (this.sample_instances[identifier] !== undefined) {

      if (this.isSamplePlaying(identifier)) {

        this.sample_instances[identifier].pause();
      }
    }
  }

  resumeSample(identifier) {

    if (this.sample_instances[identifier] !== undefined) {

      this.sample_instances[identifier].play();
    }
  }

  isSamplePaused(identifier) {

    if (this.sample_instances[identifier] === undefined) {

      // There exists no sample instance matching the specified identifier.
      return false;
    }

    return this.sample_instances[identifier].paused;
  }

  isSamplePlaying(identifier) {

    if (this.sample_instances[identifier] === undefined) {

      // There exists no sample instance matching the specified identifier.
      return false;
    }

    if (this.isSamplePaused(identifier)) {

      return false;
    }

    if (this.sample_instances[identifier].currentTime < this.sample_instances[identifier].duration) {

      return true;
    }

    return false;
  }

  loadBitmap(file_name) {

    let element = new Image();

    element.src = file_name;

    let reject_function = undefined;
    let resolve_function = undefined;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let sub_canvas = document.createElement("canvas");
          let sub_canvas_context = sub_canvas.getContext("2d");

          let bitmap = {

            canvas: sub_canvas,

            context: sub_canvas_context,

            width: 0,

            height: 0
          };

          bitmap.canvas.width = element.width;
          bitmap.canvas.height = element.height;

          bitmap.context.drawImage(element, 0, 0);

          bitmap.width = element.width;
          bitmap.height = element.height;

          resolve(bitmap);
        };

        reject_function = () => {

          reject(false);
        };

        element.addEventListener("load", resolve_function);
        element.addEventListener("error", reject_function);
      }
    ).then(

      (resolved) => {

        element.removeEventListener("load", resolve_function);
        element.removeEventListener("error", reject_function);

        return resolved;
      },

      (rejected) => {

        element.removeEventListener("load", resolve_function);
        element.removeEventListener("error", reject_function);

        return rejected;
      }
    );
  }

  getBitmapWidth(bitmap) {

    return bitmap.width;
  }

  getBitmapHeight(bitmap) {

    return bitmap.height;
  }

  getBitmapCanvas(bitmap) {

    return bitmap.canvas;
  }

  getBitmapCanvasContext(bitmap) {

    return bitmap.context;
  }

  drawBitmap(bitmap, x, y) {

    this.target_canvas.context.drawImage(bitmap.canvas, x, y);
  }

  drawScaledBitmap(bitmap, origin_x, origin_y, scale_width, scale_height, x, y) {

    // Keep origin_x within the bitmap's horizontal boundaries.
    origin_x = (origin_x < 0 ? 0 : origin_x);
    origin_x = (origin_x > bitmap.width ? bitmap.width : origin_x);

    // Keep origin_y within the bitmap's vertical boundaries.
    origin_y = (origin_y < 0 ? 0 : origin_y);
    origin_y = (origin_y > bitmap.height ? bitmap.height : origin_y);

    this.saveCanvasState();

    this.translateCanvas(x, y);
    this.scaleCanvas(scale_width, scale_height);

    this.drawBitmap(bitmap, -origin_x, -origin_y);

    this.restoreCanvasState();
  }

  drawTintedBitmap(bitmap, tint, x, y) {

    this.drawBitmap(this.createTintedBitmap(bitmap, tint), x, y);
  }

  drawClippedBitmap(bitmap, start_x, start_y, width, height, x, y) {

    this.target_canvas.context.drawImage(bitmap.canvas, start_x, start_y, width, height, x, y, width, height);
  }

  drawRotatedBitmap(bitmap, center_x, center_y, draw_x, draw_y, angle) {

    this.saveCanvasState();

    this.translateCanvas(draw_x + center_x, draw_y + center_y);
    this.rotateCanvas(angle);

    this.drawBitmap(bitmap, -center_x, -center_y);

    this.restoreCanvasState();
  }

  createBitmap(width, height) {

    let canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    let context = canvas.getContext("2d");

    return {

      canvas: canvas,

      context: context,

      width: width,

      height: height
    };
  }

  createTintedBitmap(bitmap, tint) {

    let canvas = this.createBitmap(bitmap.width, bitmap.height);

    let context = canvas.context;

    let old_target = this.getTargetCanvas();

    this.setTargetCanvas(canvas.canvas);

    this.drawBitmap(bitmap, 0, 0);

    this.setBlendMode("multiply");

    // Apply the tint.
    this.drawFilledRectangle(0, 0, canvas.width, canvas.height, tint);

    this.setBlendMode("destination-atop");

    // Compensate for transparent pixels in the bitmap.
    this.drawBitmap(bitmap, 0, 0);

    this.setTargetCanvas(old_target);

    return canvas;
  }

  createClippedBitmap(bitmap, start_x, start_y, width, height) {

    let data = bitmap.context.getImageData(start_x, start_y, width, height);

    let sub_canvas = document.createElement("canvas");
    let sub_canvas_context = sub_canvas.getContext("2d");

    sub_canvas.width = width;
    sub_canvas.height = height;

    sub_canvas_context.putImageData(data, 0, 0);

    return {

      canvas: sub_canvas,

      context: sub_canvas_context,

      width: width,

      height: height
    };
  }

  drawPolyline(points, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    let x = [];
    let y = [];

    let i = 0;

    let length = points.length;

    for (i; i < length; ++i) {

      // Split the points into their respective axes.

      if (i % 2) {

        y.push(points[i]);
      }
      else {

        x.push(points[i]);
      }
    }

    this.target_canvas.context.beginPath();

    i = 0;

    length = x.length;

    for (i; i < length; ++i) {

      if (i === 0) {

        this.target_canvas.context.moveTo(x[i], y[i]);

        continue;
      }

      this.target_canvas.context.lineTo(x[i], y[i]);
    }

    this.target_canvas.context.stroke();
  }

  drawPolygon(points, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    let x = [];
    let y = [];

    let i = 0;

    let length = points.length;

    for (i; i < length; ++i) {

      // Split the points into their respective axes.

      if (i % 2) {

        y.push(points[i]);
      }
      else {

        x.push(points[i]);
      }
    }

    this.target_canvas.context.beginPath();

    i = 0;

    length = x.length;

    for (i; i < length; ++i) {

      if (i === 0) {

        this.target_canvas.context.moveTo(x[i], y[i]);

        continue;
      }

      this.target_canvas.context.lineTo(x[i], y[i]);
    }

    this.target_canvas.context.closePath();

    this.target_canvas.context.stroke();
  }

  drawFilledPolygon(points, color) {

    this.setStrokeAndFillStyle(color);

    let x = [];
    let y = [];

    let i = 0;

    let length = points.length;

    for (i; i < length; ++i) {

      // Split the points into their respective axes.

      if (i % 2) {

        y.push(points[i]);
      }
      else {

        x.push(points[i]);
      }
    }

    this.target_canvas.context.beginPath();

    i = 0;

    length = x.length;

    for (i; i < length; ++i) {

      if (i === 0) {

        this.target_canvas.context.moveTo(x[i], y[i]);

        continue;
      }

      this.target_canvas.context.lineTo(x[i], y[i]);
    }

    this.target_canvas.context.closePath();

    this.target_canvas.context.fill();
  }

  drawLine(begin_x, begin_y, end_x, end_y, color, thickness) {

    this.drawPolyline([begin_x, begin_y, end_x, end_y], color, thickness);
  }

  drawPixel(x, y, color) {

    this.drawFilledRectangle(x, y, x + 1, y + 1, color);
  }

  drawArc(center_x, center_y, radius, start_angle, end_angle, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.target_canvas.context.closePath();
    this.target_canvas.context.stroke();
  }

  drawFilledArc(center_x, center_y, radius, start_angle, end_angle, color) {

    this.setStrokeAndFillStyle(color);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.target_canvas.context.closePath();
    this.target_canvas.context.fill();
  }

  drawCircle(center_x, center_y, radius, color, thickness) {

    this.drawArc(center_x, center_y, radius, 0, 2 * Math.PI, color, thickness);
  }

  drawFilledCircle(center_x, center_y, radius, color) {

    this.drawFilledArc(center_x, center_y, radius, 0, 2 * Math.PI, color);
  }

  drawEllipse(center_x, center_y, radius_x, radius_y, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, 2 * Math.PI);
    this.target_canvas.context.closePath();
    this.target_canvas.context.stroke();
  }

  drawFilledEllipse(center_x, center_y, radius_x, radius_y, color) {

    this.setStrokeAndFillStyle(color);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, 2 * Math.PI);
    this.target_canvas.context.closePath();
    this.target_canvas.context.fill();
  }

  drawRectangle(begin_x, begin_y, end_x, end_y, color, thickness) {

    this.setStrokeAndFillStyle(color, thickness);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.target_canvas.context.closePath();
    this.target_canvas.context.stroke();
  }

  drawFilledRectangle(begin_x, begin_y, end_x, end_y, color) {

    this.setStrokeAndFillStyle(color);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.target_canvas.context.closePath();
    this.target_canvas.context.fill();
  }

  drawTriangle(x_1, y_1, x_2, y_2, x_3, y_3, color, thickness) {

    this.drawPolygon([x_1, y_1, x_2, y_2, x_3, y_3], color, thickness);
  }

  drawFilledTriangle(x_1, y_1, x_2, y_2, x_3, y_3, color) {

    this.drawFilledPolygon([x_1, y_1, x_2, y_2, x_3, y_3], color);
  }
};
