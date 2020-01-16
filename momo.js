"use strict";

let Momo = new class {

  constructor() {

    this.canvas = undefined;
    this.context = undefined;

    this.mouse = {};
    this.keyboard = {};

    this.time_initialized = undefined;

    this.sample_instances = [];

    this.back_buffer = undefined;

    this.version = 2;

    this.shader_program = undefined;
    this.locations = {};

    this.texture_filtering = undefined;

    this.canvas_width = 0;
    this.canvas_height = 0;

    this.matrix_stack = [];

    this.cache = {};
  }

  initialize() {

    let canvas = document.createElement("canvas");

    if (!!!(canvas && canvas.getContext("webgl2"))) {

      // The browser does not support the canvas element or WebGL 2.
      return false;
    }

    // Set the time in which the library was initialized.
    this.time_initialized = Date.now();

    this.mouse = {

      x: 0,

      y: 0,

      z: 0,

      button: [],

      buttons: this.defineMouseButtons(),

      pressed: [],

      released: [],

      focused: false,

      method: this.manageMouseEvents.bind(this)
    };

    this.keyboard = {

      key: [],

      codes: this.defineKeyCodes(),

      pressed: [],

      released: [],

      method: this.manageKeyboardEvents.bind(this)
    };

    this.cache = {

      tint: "",

      texture_offset: [],

      font_texture: undefined,

      font_canvas: undefined,

      font_canvas_context: undefined,

      texture: undefined
    };

    this.matrix_stack[0] = this.getIdentityMatrix();

    return true;
  }

  createShadersAndPrograms() {

    let vertex_shader_source = `

      #version 300 es

      in vec2 a_vertex_position;

      in vec2 a_texture_position;

      uniform mat3 u_matrix;

      uniform vec2 u_canvas_resolution;

      out vec2 v_texture_position;

      void main(void) {

        // Convert from pixel space to clip space.
        vec2 clip_space_position = vec2((u_matrix * vec3(a_vertex_position, 1.0)).xy / u_canvas_resolution) * 2.0 - 1.0;

        // Flip the Y axis.
        clip_space_position.y *= -1.0;

        gl_Position = vec4(clip_space_position, 0.0, 1.0);

        v_texture_position = a_texture_position;
      }
    `;

    let fragment_shader_source = `

      #version 300 es

      precision mediump float;

      in vec2 v_texture_position;

      uniform sampler2D u_texture;

      uniform vec4 u_tint;

      uniform vec4 u_texture_offset;

      out vec4 output_color;

      void main(void) {

        vec2 texture_position = v_texture_position;

        // Offset the texture back to the top left origin of the bitmap.
        texture_position += vec2(u_texture_offset[0], u_texture_offset[1]);

        if (texture_position.x < u_texture_offset[0] || texture_position.y < u_texture_offset[1]) {

          // Don't draw texels outside of the beginning offset.
          discard;
        }

        if (texture_position.x > u_texture_offset[2] || texture_position.y > u_texture_offset[3]) {

          // Don't draw texels outside of the ending offset.
          discard;
        }

        output_color = texture(u_texture, texture_position) * u_tint;
      }
    `;

    let vertex_shader = this.createShader(vertex_shader_source.trim(), this.context.VERTEX_SHADER);

    let fragment_shader = this.createShader(fragment_shader_source.trim(), this.context.FRAGMENT_SHADER);

    this.shader_program = this.createProgram(vertex_shader, fragment_shader);

    return !!vertex_shader && !!fragment_shader && !!this.shader_program;
  }

  createShader(source, type) {

    let shader = this.context.createShader(type);

    this.context.shaderSource(shader, source);

    this.context.compileShader(shader);

    if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {

      // The shader failed to compile.
      return false;
    }

    return shader;
  }

  createProgram(vertex_shader, fragment_shader) {

    let program = this.context.createProgram();

    this.context.attachShader(program, vertex_shader);
    this.context.attachShader(program, fragment_shader);

    this.context.linkProgram(program);

    if (!this.context.getProgramParameter(program, this.context.LINK_STATUS)) {

      // The program failed to link the two shaders.
      return false;
    }

    // The compiled shaders are not needed after being linked.
    this.context.deleteShader(vertex_shader);
    this.context.deleteShader(fragment_shader);

    return program;
  }

  getUniformAndAttributeLocations() {

    this.locations.a_vertex_position = this.context.getAttribLocation(this.shader_program, "a_vertex_position");
    this.locations.a_texture_position = this.context.getAttribLocation(this.shader_program, "a_texture_position");

    this.locations.u_tint = this.context.getUniformLocation(this.shader_program, "u_tint");
    this.locations.u_matrix = this.context.getUniformLocation(this.shader_program, "u_matrix");
    this.locations.u_texture = this.context.getUniformLocation(this.shader_program, "u_texture");
    this.locations.u_texture_offset = this.context.getUniformLocation(this.shader_program, "u_texture_offset");
    this.locations.u_canvas_resolution = this.context.getUniformLocation(this.shader_program, "u_canvas_resolution");

    let key = undefined;

    for (key in this.locations) {

      if (this.locations[key] == -1 || this.locations[key] == null) {

        // Failed to find location of an attribute or uniform.
        return false;
      }
    }

    return true;
  }

  setUniformsAndAttributes() {

    this.context.useProgram(this.shader_program);

    let vertex_buffer = this.context.createBuffer();

    let vertex_buffer_data = new Float32Array(

      [

        0.0, 0.0,

        this.canvas_width, 0.0,

        this.canvas_width, this.canvas_height,

        0.0, this.canvas_height
      ]
    );

    this.context.bindBuffer(this.context.ARRAY_BUFFER, vertex_buffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, vertex_buffer_data, this.context.STATIC_DRAW);

    this.context.vertexAttribPointer(this.locations.a_vertex_position, 2, this.context.FLOAT, false, 0, 0);
    this.context.enableVertexAttribArray(this.locations.a_vertex_position);

    let texture_buffer = this.context.createBuffer();

    let texture_buffer_data = new Float32Array(

      [

        0.0, 0.0,

        1.0, 0.0,

        1.0, 1.0,

        0.0, 1.0
      ]
    );

    this.context.bindBuffer(this.context.ARRAY_BUFFER, texture_buffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, texture_buffer_data, this.context.STATIC_DRAW);

    this.context.vertexAttribPointer(this.locations.a_texture_position, 2, this.context.FLOAT, false, 0, 0);
    this.context.enableVertexAttribArray(this.locations.a_texture_position);

    // Upload the canvas' resolution.
    this.context.uniform2fv(this.locations.u_canvas_resolution, [this.canvas_width, this.canvas_height]);
  }

  getTime() {

    // Get the number of seconds elapsed since the library was initialized.
    return (Date.now() - this.time_initialized) / 1000;
  }

  manageMouseEvents(event) {

    switch (event.type) {

      case "wheel":

        this.mouse.z = event.deltaY < 0 ? 1 : -1;
      break;

      case "mouseup":

        this.mouse.button[event.button] = false;
        this.mouse.released[event.button] = true;
      break;

      case "mouseout":

        this.mouse.focused = false;
      break;

      case "mouseover":

        this.mouse.focused = true;
      break;

      case "mousedown":

        if (!this.mouse.button[event.button]) {

          this.mouse.pressed[event.button] = true;
        }

        this.mouse.button[event.button] = true;
      break;

      case "mousemove":

        if (this.isMouseLocked()) {

          this.mouse.x += event.movementX;
          this.mouse.y += event.movementY;
        }
        else {

          this.mouse.x = event.offsetX;
          this.mouse.y = event.offsetY;
        }
      break;
    }

    if (event.type == "wheel" || event.which == 3) {

      // Prevent default event when scrolling the wheel or right-clicking.
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

    this.canvas.addEventListener("wheel", this.mouse.method);
    this.canvas.addEventListener("mouseup", this.mouse.method);
    this.canvas.addEventListener("mouseout", this.mouse.method);
    this.canvas.addEventListener("mouseover", this.mouse.method);
    this.canvas.addEventListener("mousedown", this.mouse.method);
    this.canvas.addEventListener("mousemove", this.mouse.method);
    this.canvas.addEventListener("contextmenu", this.mouse.method);
  }

  uninstallMouse() {

    this.canvas.removeEventListener("wheel", this.mouse.method);
    this.canvas.removeEventListener("mouseup", this.mouse.method);
    this.canvas.removeEventListener("mouseout", this.mouse.method);
    this.canvas.removeEventListener("mouseover", this.mouse.method);
    this.canvas.removeEventListener("mousedown", this.mouse.method);
    this.canvas.removeEventListener("mousemove", this.mouse.method);
    this.canvas.removeEventListener("contextmenu", this.mouse.method);
  }

  isMouseFocused() {

    return this.mouse.focused;
  }

  isMouseButtonUp(button) {

    if (button == "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (!this.mouse.button[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.mouse.button[this.mouse.buttons[button]];
  }

  isMouseButtonDown(button) {

    if (button == "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse.button[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.button[this.mouse.buttons[button]];
  }

  isMouseButtonPressed(button) {

    if (button == "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse.pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.pressed[this.mouse.buttons[button]];
  }

  isMouseButtonReleased(button) {

    if (button == "any") {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse.released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.released[this.mouse.buttons[button]];
  }

  getMouseX() {

    return this.mouse.x;
  }

  getMouseY() {

    return this.mouse.y;
  }

  getMouseZ() {

    return this.mouse.z;
  }

  hideMouseCursor() {

    this.canvas.style.cursor = "none";
  }

  showMouseCursor() {

    this.canvas.style.cursor = "auto";
  }

  isMouseCursorHidden() {

    return this.canvas.style.cursor == "none";
  }

  lockMouse() {

    this.canvas.requestPointerLock();
  }

  unlockMouse() {

    if (this.isMouseLocked()) {

      document.exitPointerLock();
    }
  }

  isMouseLocked() {

    return document.pointerLockElement == this.getCanvas();
  }

  manageKeyboardEvents(event) {

    switch (event.type) {

      case "keyup":

        this.keyboard.key[event.which] = false;
        this.keyboard.released[event.which] = true;
      break;

      case "keydown":

        if (!this.keyboard.key[event.which]) {

          this.keyboard.pressed[event.which] = true;
        }

        this.keyboard.key[event.which] = true;
      break;
    }

    event.preventDefault();
  }

  installKeyboard() {

    document.addEventListener("keyup", this.keyboard.method);
    document.addEventListener("keydown", this.keyboard.method);
  }

  uninstallKeyboard() {

    document.removeEventListener("keyup", this.keyboard.method);
    document.removeEventListener("keydown", this.keyboard.method);
  }

  isKeyUp(key_code) {

    if (key_code == "any") {

      let length = this.keyboard.key.length;

      if (length == 0) {

        // Assume that at least one key is up before any keyboard events are fired.
        return true;
      }

      let i = 0;

      for (i; i < length; ++i) {

        if (!this.keyboard.key[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.keyboard.key[this.keyboard.codes[key_code]];
  }

  isKeyDown(key_code) {

    if (key_code == "any") {

      let i = 0;

      let length = this.keyboard.key.length;

      for (i; i < length; ++i) {

        if (this.keyboard.key[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.key[this.keyboard.codes[key_code]];
  }

  isKeyPressed(key_code) {

    if (key_code == "any") {

      let i = 0;

      let length = this.keyboard.pressed.length;

      for (i; i < length; ++i) {

        if (this.keyboard.pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.pressed[this.keyboard.codes[key_code]];
  }

  isKeyReleased(key_code) {

    if (key_code == "any") {

      let i = 0;

      let length = this.keyboard.released.length;

      for (i; i < length; ++i) {

        if (this.keyboard.released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.released[this.keyboard.codes[key_code]];
  }

  setCanvas(canvas_identifier, canvas_width, canvas_height) {

    let canvas = document.getElementById(canvas_identifier);

    if (!!!canvas) {

      // The specified canvas element does not exist.
      return false;
    }

    canvas.width = canvas_width;
    canvas.height = canvas_height;

    this.canvas = canvas;

    this.context = canvas.getContext(

      "webgl2",

      {

        alpha: false,

        depth: false,

        antialias: false,

        powerPreference: "high-performance",

        failIfMajorPerformanceCaveat: true
      }
    );

    this.canvas_width = canvas_width;
    this.canvas_height = canvas_height;

    // Set default blend mode.
    this.context.enable(this.context.BLEND);
    this.context.blendFunc(this.context.SRC_ALPHA, this.context.ONE_MINUS_SRC_ALPHA);
    this.context.blendEquation(this.context.FUNC_ADD);

    if (!this.createShadersAndPrograms()) {

      // Failed to create shaders and programs.
      return false;
    }

    if (!this.getUniformAndAttributeLocations()) {

      // Failed to get uniform and attribute locations.
      return false;
    }

    this.setUniformsAndAttributes();

    this.context.viewport(0, 0, canvas_width, canvas_height);

    // Use linear texture filtering by default.
    this.texture_filtering = this.context.LINEAR;

    return true;
  }

  getCanvas() {

    return this.canvas;
  }

  getCanvasContext() {

    return this.context;
  }

  getBackBuffer() {

    // Draw the contents of the main canvas to the back-buffer bitmap.
    /*this.back_buffer.context.drawImage(this.main_canvas.canvas, 0, 0);

    return this.back_buffer;*/
  }

  clearCanvas(color) {

    this.context.clearColor(color.r, color.g, color.b, color.a);

    this.context.clear(this.context.COLOR_BUFFER_BIT);
  }

  resizeCanvas(width, height) {

    this.setCanvasWidth(width);
    this.setCanvasHeight(height);
  }

  setCanvasWidth(width) {

    this.canvas.width = width;
    this.canvas_width = width;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();

    // Update the viewport to reflect the new canvas size.
    this.context.viewport(0, 0, this.canvas_width, this.canvas_height);
  }

  setCanvasHeight(height) {

    this.canvas.height = height;
    this.canvas_height = height;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();

    // Update the viewport to reflect the new canvas size.
    this.context.viewport(0, 0, this.canvas_width, this.canvas_height);
  }

  getCanvasWidth() {

    return this.canvas_width;
  }

  getCanvasHeight() {

    return this.canvas_height;
  }

  saveCanvasState() {

    this.matrix_stack.push(this.matrix_stack[this.matrix_stack.length - 1]);
  }

  restoreCanvasState() {

    this.matrix_stack.pop();

    if (this.matrix_stack.length == 0) {

      this.matrix_stack[0] = this.getIdentityMatrix();
    }
  }

  getVersion() {

    return this.version;
  }

  createGameLoop(update_procedure, render_procedure, update_interval) {

    setInterval(

      (() => {

        update_procedure();

        let i = 0;

        for (i; i < 3; ++i) {

          // Clear mouse button arrays so each mouse button event fires only once.
          this.mouse.pressed[i] = false;
          this.mouse.released[i] = false;
        }

        i = 0;

        let length = this.keyboard.key.length;

        for (i; i < length; ++i) {

          // Clear key arrays so each keyboard event fires only once.
          this.keyboard.pressed[i] = false;
          this.keyboard.released[i] = false;
        }
      }).bind(this),

      1000 / update_interval
    );

    let animation_request = () => {

      window.requestAnimationFrame(animation_request);

      render_procedure();
    };

    window.requestAnimationFrame(animation_request);
  }

  makeColor(r, g, b, a = 1.0) {

    return {r: r, g: g, b: b, a: a};
  }

  setEntryPoint(function_name) {

    // Call the specified function when the window loads.
    window.addEventListener("load", function_name);
  }

  loadFont(file_name, style = "normal") {

    return fetch(file_name).then(

      (response) => {

        if (response.status == 200) {

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
    this.drawText(font, this.makeColor(0.0, 0.0, 0.0, 0.0), 0, 0, 0, "left", "");

    return font;
  }

  drawText(font, fill_color, size, x, y, alignment, text, outline_color = undefined, outline_width = 0) {

    if (this.cache.font_texture == undefined) {

      this.cache.font_canvas = document.createElement("canvas");

      // @TODO: Update this whenever the main canvas' dimensions change.

      // Match the canvas for text-drawing to that of the main canvas' dimensions.
      this.cache.font_canvas.width = this.canvas_width;
      this.cache.font_canvas.height = this.canvas_height;

      // Use the Canvas 2D context to handle drawing text.
      this.cache.font_canvas_context = this.cache.font_canvas.getContext("2d");

      this.cache.font_texture = this.context.createTexture();

      this.context.bindTexture(this.context.TEXTURE_2D, this.cache.font_texture);

      this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, this.cache.font_canvas);

      // Clamp the texture to the edges if it bleeds beyond its boundaries.
      this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S, this.context.CLAMP_TO_EDGE);
      this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T, this.context.CLAMP_TO_EDGE);

      // Use linear filtering.
      this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.LINEAR);
      this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.LINEAR);
    }

    // Clear the canvas.
    this.cache.font_canvas_context.clearRect(0, 0, this.canvas_width, this.canvas_height);

    let r = fill_color.r * 255.0;
    let g = fill_color.g * 255.0;
    let b = fill_color.b * 255.0;
    let a = fill_color.a;

    this.cache.font_canvas_context.textAlign = alignment;

    this.cache.font_canvas_context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

    this.cache.font_canvas_context.font = font.style + " " + size + "px " + font.name;

    // Draw the text to the canvas.
    this.cache.font_canvas_context.fillText(text, x, y + size);

    if (outline_color != undefined && outline_width > 0) {

      r = outline_color.r * 255.0;
      g = outline_color.g * 255.0;
      b = outline_color.b * 255.0;
      a = outline_color.a;

      this.cache.font_canvas_context.lineWidth = outline_width;
      this.cache.font_canvas_context.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

      // Draw the outline.
      this.cache.font_canvas_context.strokeText(text, x, y + size);
    }

    this.context.bindTexture(this.context.TEXTURE_2D, this.cache.font_texture);

    // Use the font canvas' contents as a texture.
    this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, this.cache.font_canvas);

    // Create a bitmap using the texture from the font canvas.
    let font_bitmap = {

      width: this.canvas_width,

      height: this.canvas_height,

      texture: this.cache.font_texture
    };

    // Draw the font bitmap.
    this.drawBitmap(font_bitmap, 0, 0);
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

    if (this.sample_instances[identifier] == undefined) {

      // Create a new instance of the sample.
      this.sample_instances[identifier] = sample.element.cloneNode();
    }

    if (!this.isSamplePlaying(identifier)) {

      this.adjustSample(identifier, volume, speed, loop);

      this.sample_instances[identifier].play();
    }
  }

  adjustSample(identifier, volume, speed, loop) {

    if (this.sample_instances[identifier] != undefined) {

      this.sample_instances[identifier].loop = loop;
      this.sample_instances[identifier].volume = volume;
      this.sample_instances[identifier].playbackRate = speed;
    }
  }

  stopSample(identifier) {

    if (this.sample_instances[identifier] != undefined) {

      if (this.isSamplePlaying(identifier)) {

        this.pauseSample(identifier);

        this.sample_instances[identifier].currentTime = 0;
      }
    }
  }

  pauseSample(identifier) {

    if (this.sample_instances[identifier] != undefined) {

      if (this.isSamplePlaying(identifier)) {

        this.sample_instances[identifier].pause();
      }
    }
  }

  resumeSample(identifier) {

    if (this.sample_instances[identifier] != undefined) {

      this.sample_instances[identifier].play();
    }
  }

  isSamplePaused(identifier) {

    if (this.sample_instances[identifier] == undefined) {

      // There exists no sample instance matching the specified identifier.
      return false;
    }

    return this.sample_instances[identifier].paused;
  }

  isSamplePlaying(identifier) {

    if (this.sample_instances[identifier] == undefined) {

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

  getSampleProperties(identifier) {

    let properties = this.sample_instances[identifier];

    if (properties == undefined) {

      // There does not exist a sample instance with this identifier.
      return undefined;
    }
    else {

      return {

        "loop": properties.loop,

        "speed": properties.playbackRate,

        "volume": properties.volume
      };
    }
  }

  loadBitmap(file_name) {

    let element = new Image();

    element.src = file_name;

    let reject_function = undefined;
    let resolve_function = undefined;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let texture = this.context.createTexture();

          this.context.bindTexture(this.context.TEXTURE_2D, texture);

          // Use the image's contents as a texture.
          this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, element);

          // Clamp the texture to the edges if it bleeds beyond its boundaries.
          this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S, this.context.CLAMP_TO_EDGE);
          this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T, this.context.CLAMP_TO_EDGE);

          // Specify texture filtering.
          this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.texture_filtering);
          this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.texture_filtering);

          let bitmap = {

            width: element.width,

            height: element.height,

            texture: texture
          };

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

  setNewBitmapFlags(flag, value) {

    switch (flag) {

      case "filtering":

        if (value == "linear") {

          this.texture_filtering = this.context.LINEAR;
        }
        else if (value == "nearest") {

          this.texture_filtering = this.context.NEAREST;
        }
      break;
    }
  }

  getBitmapWidth(bitmap) {

    return bitmap.width;
  }

  getBitmapHeight(bitmap) {

    return bitmap.height;
  }

  drawConsolidatedBitmap(bitmap, texture_offset = [0.0, 0.0, 1.0, 1.0], tint = this.makeColor(1.0, 1.0, 1.0)) {

    let tint_needs_updating = false;
    let texture_needs_updating = false;
    let texture_offset_needs_updating = false;

    if (this.cache.tint != "" + tint.r + tint.g + tint.b + tint.a) {

      tint_needs_updating = true;
    }

    if (this.cache.texture != bitmap.texture) {

      texture_needs_updating = true;
    }

    let i = 0;

    for (i; i < 4; ++i) {

      if (this.cache.texture_offset[i] != texture_offset[i]) {

        texture_offset_needs_updating = true;

        break;
      }
    }

    this.context.useProgram(this.shader_program);

    if (texture_needs_updating) {

      // Set the active texture.
      this.context.activeTexture(this.context.TEXTURE0);
      this.context.bindTexture(this.context.TEXTURE_2D, bitmap.texture);
      this.context.uniform1i(this.locations.u_texture, 0);

      // Cache the texture for next time.
      this.cache.texture = bitmap.texture;
    }

    this.saveCanvasState();

    // Scale the texture to its proper resolution.
    this.scaleCanvas(bitmap.width / this.canvas_width, bitmap.height / this.canvas_height);

    // Upload the transformation matrix.
    this.context.uniformMatrix3fv(this.locations.u_matrix, false, this.matrix_stack[this.matrix_stack.length - 1]);

    this.restoreCanvasState();

    if (tint_needs_updating) {

      // Upload the tint.
      this.context.uniform4fv(this.locations.u_tint, [tint.r, tint.g, tint.b, tint.a]);

      // Cache the tint for next time.
      this.cache.tint = "" + tint.r + tint.g + tint.b + tint.a;
    }

    if (texture_offset_needs_updating) {

      // Upload the texture offset.
      this.context.uniform4fv(this.locations.u_texture_offset, texture_offset);

      // Cache the texture offset for next time.
      this.cache.texture_offset = texture_offset;
    }

    // Draw the bitmap.
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);
  }

  drawBitmap(bitmap, x, y) {

    this.saveCanvasState();

    this.translateCanvas(x, y);

    this.drawConsolidatedBitmap(bitmap, undefined, undefined);

    this.restoreCanvasState();
  }

  drawScaledBitmap(bitmap, origin_x, origin_y, scale_width, scale_height, draw_x, draw_y) {

    this.saveCanvasState();

    this.translateCanvas(draw_x, draw_y);

    this.scaleCanvas(scale_width, scale_height);

    this.translateCanvas(-origin_x, -origin_y);

    this.drawConsolidatedBitmap(bitmap, undefined, undefined);

    this.restoreCanvasState();
  }

  drawTintedBitmap(bitmap, tint, x, y) {

    this.saveCanvasState();

    this.translateCanvas(x, y);

    this.drawConsolidatedBitmap(bitmap, undefined, tint);

    this.restoreCanvasState();
  }

  drawClippedBitmap(bitmap, start_x, start_y, width, height, x, y) {

    let texture_offset = [

      start_x / bitmap.width,

      start_y / bitmap.height,

      (start_x + width) / bitmap.width,

      (start_y + height) / bitmap.height
    ];

    this.saveCanvasState();

    this.translateCanvas(x, y);

    this.drawConsolidatedBitmap(bitmap, texture_offset, undefined);

    this.restoreCanvasState();
  }

  drawRotatedBitmap(bitmap, center_x, center_y, draw_x, draw_y, theta) {

    this.saveCanvasState();

    this.translateCanvas(draw_x, draw_y);

    this.rotateCanvas(theta);

    this.translateCanvas(-center_x, -center_y);

    this.drawConsolidatedBitmap(bitmap, undefined, undefined);

    this.restoreCanvasState();
  }

  drawPolyline(points, color, thickness) {

    /*this.setStrokeAndFillStyle(color, thickness);

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

    this.target_canvas.context.stroke();*/
  }

  drawPolygon(points, color, thickness) {

    /*this.setStrokeAndFillStyle(color, thickness);

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

    this.target_canvas.context.stroke();*/
  }

  drawFilledPolygon(points, color) {

    /*this.setStrokeAndFillStyle(color);

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

    this.target_canvas.context.fill();*/
  }

  drawLine(begin_x, begin_y, end_x, end_y, color, thickness) {

    /*this.drawPolyline([begin_x, begin_y, end_x, end_y], color, thickness);*/
  }

  drawPixel(x, y, color) {

    /*this.drawFilledRectangle(x, y, x + 1, y + 1, color);*/
  }

  drawArc(center_x, center_y, radius, start_angle, end_angle, color, thickness) {

    /*this.setStrokeAndFillStyle(color, thickness);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.target_canvas.context.closePath();
    this.target_canvas.context.stroke();*/
  }

  drawFilledArc(center_x, center_y, radius, start_angle, end_angle, color) {

    /*this.setStrokeAndFillStyle(color);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.arc(center_x, center_y, radius, start_angle, end_angle);
    this.target_canvas.context.closePath();
    this.target_canvas.context.fill();*/
  }

  drawCircle(center_x, center_y, radius, color, thickness) {

    /*this.drawArc(center_x, center_y, radius, 0, 2 * Math.PI, color, thickness);*/
  }

  drawFilledCircle(center_x, center_y, radius, color) {

    /*this.drawFilledArc(center_x, center_y, radius, 0, 2 * Math.PI, color);*/
  }

  drawEllipse(center_x, center_y, radius_x, radius_y, color, thickness) {

    /*this.setStrokeAndFillStyle(color, thickness);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, 2 * Math.PI);
    this.target_canvas.context.closePath();
    this.target_canvas.context.stroke();*/
  }

  drawFilledEllipse(center_x, center_y, radius_x, radius_y, color) {

    /*this.setStrokeAndFillStyle(color);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, 2 * Math.PI);
    this.target_canvas.context.closePath();
    this.target_canvas.context.fill();*/
  }

  drawRectangle(begin_x, begin_y, end_x, end_y, color, thickness) {

    /*this.setStrokeAndFillStyle(color, thickness);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.target_canvas.context.closePath();
    this.target_canvas.context.stroke();*/
  }

  drawFilledRectangle(begin_x, begin_y, end_x, end_y, color) {

    /*this.setStrokeAndFillStyle(color);

    this.target_canvas.context.beginPath();
    this.target_canvas.context.rect(begin_x, begin_y, end_x - begin_x, end_y - begin_y);
    this.target_canvas.context.closePath();
    this.target_canvas.context.fill();*/
  }

  drawTriangle(x_1, y_1, x_2, y_2, x_3, y_3, color, thickness) {

    /*this.drawPolygon([x_1, y_1, x_2, y_2, x_3, y_3], color, thickness);*/
  }

  drawFilledTriangle(x_1, y_1, x_2, y_2, x_3, y_3, color) {

    /*this.drawFilledPolygon([x_1, y_1, x_2, y_2, x_3, y_3], color);*/
  }

  getIdentityMatrix() {

    return [

      1.0, 0.0, 0.0,

      0.0, 1.0, 0.0,

      0.0, 0.0, 1.0
    ]
  }

  scaleCanvas(scale_x, scale_y) {

    let scaled_matrix = [

      scale_x, 0.0, 0.0,

      0.0, scale_y, 0.0,

      0.0, 0.0, 1.0
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], scaled_matrix);

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  rotateCanvas(theta) {

    let sine = Math.sin(theta);
    let cosine = Math.cos(theta);

    let rotated_matrix = [

      cosine, sine, 0.0,

      -sine, cosine, 0.0,

      0.0, 0.0, 1.0
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], rotated_matrix)

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  translateCanvas(translate_x, translate_y) {

    let translated_matrix = [

      1.0, 0.0, 0.0,

      0.0, 1.0, 0.0,

      translate_x, translate_y, 1.0
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], translated_matrix);

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  multiplyMatrices(a, b) {

    let a_1_1 = a[0];
    let a_1_2 = a[3];
    let a_1_3 = a[6];
    let a_2_1 = a[1];
    let a_2_2 = a[4];
    let a_2_3 = a[7];
    let a_3_1 = a[2];
    let a_3_2 = a[5];
    let a_3_3 = a[8];

    let b_1_1 = b[0];
    let b_1_2 = b[3];
    let b_1_3 = b[6];
    let b_2_1 = b[1];
    let b_2_2 = b[4];
    let b_2_3 = b[7];
    let b_3_1 = b[2];
    let b_3_2 = b[5];
    let b_3_3 = b[8];

    let multiplied_matrix = this.getIdentityMatrix();

    multiplied_matrix[0] = a_1_1 * b_1_1 + a_1_2 * b_2_1 + a_1_3 * b_3_1;
    multiplied_matrix[3] = a_1_1 * b_1_2 + a_1_2 * b_2_2 + a_1_3 * b_3_2;
    multiplied_matrix[6] = a_1_1 * b_1_3 + a_1_2 * b_2_3 + a_1_3 * b_3_3;

    multiplied_matrix[1] = a_2_1 * b_1_1 + a_2_2 * b_2_1 + a_2_3 * b_3_1;
    multiplied_matrix[4] = a_2_1 * b_1_2 + a_2_2 * b_2_2 + a_2_3 * b_3_2;
    multiplied_matrix[7] = a_2_1 * b_1_3 + a_2_2 * b_2_3 + a_2_3 * b_3_3;

    multiplied_matrix[2] = a_3_1 * b_1_1 + a_3_2 * b_2_1 + a_3_3 * b_3_1;
    multiplied_matrix[5] = a_3_1 * b_1_2 + a_3_2 * b_2_2 + a_3_3 * b_3_2;
    multiplied_matrix[8] = a_3_1 * b_1_3 + a_3_2 * b_2_3 + a_3_3 * b_3_3;

    return multiplied_matrix;
  }
};
