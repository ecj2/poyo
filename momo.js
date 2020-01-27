"use strict";

let Momo = new class {

  constructor() {

    this.cache = {};
    this.mouse = {};
    this.canvas = {};
    this.target = {};
    this.keyboard = {};

    this.time_initialized = undefined;

    this.sample_instances = [];

    this.version = 2;

    this.shader_program = undefined;
    this.locations = {};

    this.texture_flags = {};

    this.matrix_stack = [];
  }

  initialize(canvas_identifier, canvas_width, canvas_height) {

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

      texture: undefined,

      texture_offset: [],

      font_texture: undefined,

      font_canvas: undefined,

      use_texture: true,

      font_canvas_context: undefined,

      flip_texture_offset: false
    };

    this.matrix_stack[0] = this.getIdentityMatrix();

    canvas = document.getElementById(canvas_identifier);

    if (!!!canvas) {

      // The specified canvas element does not exist.
      return false;
    }

    canvas.width = canvas_width;
    canvas.height = canvas_height;

    this.canvas = {

      canvas: canvas,

      context: canvas.getContext(

        "webgl2",

        {

          alpha: false,

          depth: false,

          antialias: false,

          powerPreference: "high-performance",

          preserveDrawingBuffer: true,

          failIfMajorPerformanceCaveat: true
        }
      ),

      width: canvas_width,

      height: canvas_height
    };

    // Set default blend mode.
    this.canvas.context.enable(this.canvas.context.BLEND);
    this.canvas.context.blendFunc(this.canvas.context.SRC_ALPHA, this.canvas.context.ONE_MINUS_SRC_ALPHA);
    this.canvas.context.blendEquation(this.canvas.context.FUNC_ADD);

    if (!this.createShadersAndPrograms()) {

      // Failed to create shaders and programs.
      return false;
    }

    if (!this.getUniformAndAttributeLocations()) {

      // Failed to get uniform and attribute locations.
      return false;
    }

    this.texture_flags = {

      filtering: this.canvas.context.LINEAR
    };

    this.target = {

      width: canvas_width,

      height: canvas_height
    };

    this.setUniformsAndAttributes();

    this.canvas.context.viewport(0, 0, this.target.width, this.target.height);

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

        // Convert from pixel coordinates to normalized device coordinates.
        vec2 clip_space_position = vec2(u_matrix * vec3(a_vertex_position, 1.0)).xy / u_canvas_resolution * 2.0 - 1.0;

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

      uniform vec4 u_tint;

      uniform bool u_use_texture;

      uniform sampler2D u_texture;

      uniform vec4 u_texture_offset;

      uniform bool u_flip_texture_offset;

      out vec4 output_color;

      void main(void) {

        vec2 texture_position = v_texture_position;

        bool discard_condition = false;

        if (u_flip_texture_offset) {

          texture_position.t = texture_position.t * -1.0 + 1.0;

          texture_position += vec2(u_texture_offset[0], -u_texture_offset[1]);

          discard_condition = discard_condition || texture_position.t < u_texture_offset[3] * -1.0 + 1.0;
        }
        else {

          texture_position += vec2(u_texture_offset[0], u_texture_offset[1]);

          discard_condition = discard_condition || texture_position.t > u_texture_offset[3];
        }

        discard_condition = discard_condition || texture_position.t < 0.0 || texture_position.t > 1.0;
        discard_condition = discard_condition ||texture_position.s < 0.0 || texture_position.s > u_texture_offset[2] || texture_position.s > 1.0;

        if (discard_condition) {

           // Don't draw texels outside of the beginning or ending offsets.
          discard;
        }

        if (u_use_texture) {

          output_color = texture(u_texture, texture_position) * u_tint;
        }
        else {

          output_color = u_tint;
        }
      }
    `;

    let vertex_shader = this.createShader(vertex_shader_source.trim(), this.canvas.context.VERTEX_SHADER);

    let fragment_shader = this.createShader(fragment_shader_source.trim(), this.canvas.context.FRAGMENT_SHADER);

    this.shader_program = this.createProgram(vertex_shader, fragment_shader);

    return !!vertex_shader && !!fragment_shader && !!this.shader_program;
  }

  createShader(source, type) {

    let shader = this.canvas.context.createShader(type);

    this.canvas.context.shaderSource(shader, source);

    this.canvas.context.compileShader(shader);

    if (!this.canvas.context.getShaderParameter(shader, this.canvas.context.COMPILE_STATUS)) {

      // The shader failed to compile.
      return false;
    }

    return shader;
  }

  createProgram(vertex_shader, fragment_shader) {

    let program = this.canvas.context.createProgram();

    this.canvas.context.attachShader(program, vertex_shader);
    this.canvas.context.attachShader(program, fragment_shader);

    this.canvas.context.linkProgram(program);

    if (!this.canvas.context.getProgramParameter(program, this.canvas.context.LINK_STATUS)) {

      // The program failed to link the two shaders.
      return false;
    }

    // The compiled shaders are not needed after being linked.
    this.canvas.context.deleteShader(vertex_shader);
    this.canvas.context.deleteShader(fragment_shader);

    return program;
  }

  getUniformAndAttributeLocations() {

    this.locations.a_vertex_position = this.canvas.context.getAttribLocation(this.shader_program, "a_vertex_position");
    this.locations.a_texture_position = this.canvas.context.getAttribLocation(this.shader_program, "a_texture_position");

    this.locations.u_tint = this.canvas.context.getUniformLocation(this.shader_program, "u_tint");
    this.locations.u_matrix = this.canvas.context.getUniformLocation(this.shader_program, "u_matrix");
    this.locations.u_texture = this.canvas.context.getUniformLocation(this.shader_program, "u_texture");
    this.locations.u_use_texture = this.canvas.context.getUniformLocation(this.shader_program, "u_use_texture");
    this.locations.u_texture_offset = this.canvas.context.getUniformLocation(this.shader_program, "u_texture_offset");
    this.locations.u_canvas_resolution = this.canvas.context.getUniformLocation(this.shader_program, "u_canvas_resolution");
    this.locations.u_flip_texture_offset = this.canvas.context.getUniformLocation(this.shader_program, "u_flip_texture_offset");

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

    this.canvas.context.useProgram(this.shader_program);

    let vertex_buffer = this.canvas.context.createBuffer();

    let vertex_buffer_data = new Float32Array(

      [

        0.0, 0.0,

        this.target.width, 0.0,

        this.target.width, this.target.height,

        0.0, this.target.height
      ]
    );

    this.canvas.context.bindBuffer(this.canvas.context.ARRAY_BUFFER, vertex_buffer);
    this.canvas.context.bufferData(this.canvas.context.ARRAY_BUFFER, vertex_buffer_data, this.canvas.context.STATIC_DRAW);

    this.canvas.context.vertexAttribPointer(this.locations.a_vertex_position, 2, this.canvas.context.FLOAT, false, 0, 0);
    this.canvas.context.enableVertexAttribArray(this.locations.a_vertex_position);

    let texture_buffer = this.canvas.context.createBuffer();

    let texture_buffer_data = new Float32Array(

      [

        0.0, 0.0,

        1.0, 0.0,

        1.0, 1.0,

        0.0, 1.0
      ]
    );

    this.canvas.context.bindBuffer(this.canvas.context.ARRAY_BUFFER, texture_buffer);
    this.canvas.context.bufferData(this.canvas.context.ARRAY_BUFFER, texture_buffer_data, this.canvas.context.STATIC_DRAW);

    this.canvas.context.vertexAttribPointer(this.locations.a_texture_position, 2, this.canvas.context.FLOAT, false, 0, 0);
    this.canvas.context.enableVertexAttribArray(this.locations.a_texture_position);

    // Upload the target's resolution.
    this.canvas.context.uniform2fv(this.locations.u_canvas_resolution, [this.target.width, this.target.height]);
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

  useMouse(use_mouse = true) {

    if (use_mouse) {

      this.canvas.canvas.addEventListener("wheel", this.mouse.method);
      this.canvas.canvas.addEventListener("mouseup", this.mouse.method);
      this.canvas.canvas.addEventListener("mouseout", this.mouse.method);
      this.canvas.canvas.addEventListener("mouseover", this.mouse.method);
      this.canvas.canvas.addEventListener("mousedown", this.mouse.method);
      this.canvas.canvas.addEventListener("mousemove", this.mouse.method);
      this.canvas.canvas.addEventListener("contextmenu", this.mouse.method);
    }
    else {

      this.canvas.canvas.removeEventListener("wheel", this.mouse.method);
      this.canvas.canvas.removeEventListener("mouseup", this.mouse.method);
      this.canvas.canvas.removeEventListener("mouseout", this.mouse.method);
      this.canvas.canvas.removeEventListener("mouseover", this.mouse.method);
      this.canvas.canvas.removeEventListener("mousedown", this.mouse.method);
      this.canvas.canvas.removeEventListener("mousemove", this.mouse.method);
      this.canvas.canvas.removeEventListener("contextmenu", this.mouse.method);
    }
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

  hideMouse() {

    this.canvas.canvas.style.cursor = "none";
  }

  showMouse() {

    this.canvas.canvas.style.cursor = "auto";
  }

  isMouseHidden() {

    return this.canvas.canvas.style.cursor == "none";
  }

  lockMouse() {

    this.canvas.canvas.requestPointerLock();
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

  useKeyboard(use_keyboard = true) {

    if (use_keyboard) {

      document.addEventListener("keyup", this.keyboard.method);
      document.addEventListener("keydown", this.keyboard.method);
    }
    else {

      document.removeEventListener("keyup", this.keyboard.method);
      document.removeEventListener("keydown", this.keyboard.method);
    }
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

  getCanvas() {

    return this.canvas.canvas;
  }

  getContext() {

    return this.canvas.context;
  }

  clearToColor(color) {

    this.canvas.context.clearColor(color.r, color.g, color.b, color.a);

    this.canvas.context.clear(this.canvas.context.COLOR_BUFFER_BIT);
  }

  resizeCanvas(width, height) {

    this.setCanvasWidth(width);
    this.setCanvasHeight(height);
  }

  setCanvasWidth(width) {

    this.canvas.width = width;
    this.target.width = width;
    this.canvas.canvas.width = width;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();

    // Update the viewport to reflect the new canvas size.
    this.canvas.context.viewport(0, 0, this.target.width, this.target.height);
  }

  setCanvasHeight(height) {

    this.canvas.height = height;
    this.target.height = height;
    this.canvas.canvas.height = height;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();

    // Update the viewport to reflect the new canvas size.
    this.canvas.context.viewport(0, 0, this.target.width, this.target.height);
  }

  getCanvasWidth() {

    return this.canvas.width;
  }

  getCanvasHeight() {

    return this.canvas.height;
  }

  saveMatrix() {

    this.matrix_stack.push(this.matrix_stack[this.matrix_stack.length - 1]);
  }

  restoreMatrix() {

    this.matrix_stack.pop();

    if (this.matrix_stack.length == 0) {

      this.matrix_stack[0] = this.getIdentityMatrix();
    }
  }

  getVersion() {

    return this.version;
  }

  createGameLoop(update_function, render_function, update_interval) {

    setInterval(

      (() => {

        update_function();

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

      render_function();
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

              font-family: "${font_name}";
              src: url("${file_name}");
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
      this.cache.font_canvas.width = this.canvas.width;
      this.cache.font_canvas.height = this.canvas.height;

      // Use the Canvas 2D context to handle drawing text.
      this.cache.font_canvas_context = this.cache.font_canvas.getContext("2d");

      this.cache.font_texture = this.createTexture(this.canvas.width, this.canvas.height);

      this.cache.font_texture.must_be_flipped = false;
    }

    // Clear the canvas.
    this.cache.font_canvas_context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let r = fill_color.r * 255.0;
    let g = fill_color.g * 255.0;
    let b = fill_color.b * 255.0;
    let a = fill_color.a;

    this.cache.font_canvas_context.textAlign = alignment;

    this.cache.font_canvas_context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;

    this.cache.font_canvas_context.font = `${font.style} ${size}px ${font.name}`;

    // Draw the text to the canvas.
    this.cache.font_canvas_context.fillText(text, x, y + size);

    if (outline_color != undefined && outline_width > 0) {

      r = outline_color.r * 255.0;
      g = outline_color.g * 255.0;
      b = outline_color.b * 255.0;
      a = outline_color.a;

      this.cache.font_canvas_context.lineWidth = outline_width;
      this.cache.font_canvas_context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;

      // Draw the outline.
      this.cache.font_canvas_context.strokeText(text, x, y + size);
    }

    // Use the font canvas' contents as a texture.
    this.canvas.context.bindTexture(this.canvas.context.TEXTURE_2D, this.cache.font_texture.texture);
    this.canvas.context.texImage2D(this.canvas.context.TEXTURE_2D, 0, this.canvas.context.RGBA, this.canvas.context.RGBA, this.canvas.context.UNSIGNED_BYTE, this.cache.font_canvas);

    // Draw the font texture.
    this.drawTexture(this.cache.font_texture, 0, 0);
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

  playSample(sample, volume, speed, repeat, identifier) {

    if (this.sample_instances[identifier] == undefined) {

      // Create a new instance of the sample.
      this.sample_instances[identifier] = sample.element.cloneNode();
    }

    if (!this.isSamplePlaying(identifier)) {

      this.adjustSample(identifier, volume, speed, repeat);

      this.sample_instances[identifier].play();
    }
  }

  adjustSample(identifier, volume, speed, repeat) {

    if (this.sample_instances[identifier] != undefined) {

      this.sample_instances[identifier].loop = repeat;
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

    return {

      "speed": properties.playbackRate,

      "repeat": properties.loop,

      "volume": properties.volume
    };
  }

  getSampleDuration(sample) {

    if (sample == undefined) {

      // Invalid sample.
      return 0;
    }

    return sample.element.duration;
  }

  getSampleSeek(identifier) {

    if (this.sample_instances[identifier] == undefined) {

      // Invalid sample.
      return 0;
    }

    return this.sample_instances[identifier].currentTime;
  }

  setSampleSeek(identifier, seek) {

    if (this.sample_instances[identifier] != undefined) {

      this.sample_instances[identifier].currentTime = seek;
    }
  }

  loadTexture(file_name) {

    let element = new Image();

    element.src = file_name;

    let reject_function = undefined;
    let resolve_function = undefined;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let texture = this.createTexture(element.width, element.height);

          // Use the image's contents as a texture.
          this.canvas.context.bindTexture(this.canvas.context.TEXTURE_2D, texture.texture);
          this.canvas.context.texImage2D(this.canvas.context.TEXTURE_2D, 0, this.canvas.context.RGBA, this.canvas.context.RGBA, this.canvas.context.UNSIGNED_BYTE, element);

          texture.must_be_flipped = false;

          resolve(texture);
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

  setNewTextureFlags(flag, value) {

    switch (flag) {

      case "filtering":

        if (value == "linear") {

          this.texture_flags.filtering = this.canvas.context.LINEAR;
        }
        else if (value == "nearest") {

          this.texture_flags.filtering = this.canvas.context.NEAREST;
        }
      break;
    }
  }

  getTextureWidth(texture) {

    return texture.width;
  }

  getTextureHeight(texture) {

    return texture.height;
  }

  drawConsolidatedTexture(texture, texture_offset = [0.0, 0.0, 1.0, 1.0], tint = this.makeColor(1.0, 1.0, 1.0), flip_texture_offset = false) {

    let tint_needs_updating = false;
    let texture_needs_updating = false;
    let use_texture_needs_updating = false;
    let texture_offset_needs_updating = false;
    let flip_texture_offset_needs_updating = false;

    if (this.cache.tint != "" + tint.r + tint.g + tint.b + tint.a) {

      tint_needs_updating = true;
    }

    if (this.cache.texture != texture.texture) {

      texture_needs_updating = true;
    }

    let i = 0;

    for (i; i < 4; ++i) {

      if (this.cache.texture_offset[i] != texture_offset[i]) {

        texture_offset_needs_updating = true;

        break;
      }
    }

    if (this.cache.flip_texture_offset != flip_texture_offset) {

      flip_texture_offset_needs_updating = true;
    }

    this.canvas.context.useProgram(this.shader_program);

    if (this.cache.use_texture == false) {

      use_texture_needs_updating = true;
    }

    if (use_texture_needs_updating) {

      this.canvas.context.uniform1i(this.locations.u_use_texture, true);

      this.cache.use_texture = true;
    }

    if (texture_needs_updating) {

      // Set the active texture.
      this.canvas.context.activeTexture(this.canvas.context.TEXTURE0);
      this.canvas.context.bindTexture(this.canvas.context.TEXTURE_2D, texture.texture);
      this.canvas.context.uniform1i(this.locations.u_texture, 0);

      // Cache the texture for next time.
      this.cache.texture = texture.texture;
    }

    this.saveMatrix();

    if (texture.must_be_flipped) {

      // Flip frame-buffer textures right-side up.
      this.scaleMatrix(1.0, -1.0);
      this.translateMatrix(0.0, -texture.height);
    }

    // Scale the texture to its proper resolution.
    this.scaleMatrix(texture.width / this.target.width, texture.height / this.target.height);

    // Upload the transformation matrix.
    this.canvas.context.uniformMatrix3fv(this.locations.u_matrix, false, this.matrix_stack[this.matrix_stack.length - 1]);

    this.restoreMatrix();

    if (tint_needs_updating) {

      // Upload the tint.
      this.canvas.context.uniform4fv(this.locations.u_tint, [tint.r, tint.g, tint.b, tint.a]);

      // Cache the tint for next time.
      this.cache.tint = "" + tint.r + tint.g + tint.b + tint.a;
    }

    if (texture_offset_needs_updating) {

      // Upload the texture offset.
      this.canvas.context.uniform4fv(this.locations.u_texture_offset, texture_offset);

      // Cache the texture offset for next time.
      this.cache.texture_offset = texture_offset;
    }

    if (flip_texture_offset_needs_updating) {

      // Flip the texture offset.
      this.canvas.context.uniform1i(this.locations.u_flip_texture_offset, flip_texture_offset);

      // Cache this for next time.
      this.cache.flip_texture_offset = flip_texture_offset;
    }

    // Draw the texture.
    this.canvas.context.drawArrays(this.canvas.context.TRIANGLE_FAN, 0, 4);
  }

  drawTexture(texture, x, y) {

    this.saveMatrix();

    this.translateMatrix(x, y);

    this.drawConsolidatedTexture(texture, undefined, undefined);

    this.restoreMatrix();
  }

  drawScaledTexture(texture, origin_x, origin_y, scale_width, scale_height, draw_x, draw_y) {

    this.saveMatrix();

    this.translateMatrix(draw_x, draw_y);

    this.scaleMatrix(scale_width, scale_height);

    this.translateMatrix(-origin_x, -origin_y);

    this.drawConsolidatedTexture(texture, undefined, undefined);

    this.restoreMatrix();
  }

  drawTintedTexture(texture, tint, x, y) {

    this.saveMatrix();

    this.translateMatrix(x, y);

    this.drawConsolidatedTexture(texture, undefined, tint);

    this.restoreMatrix();
  }

  drawClippedTexture(texture, start_x, start_y, width, height, x, y) {

    let texture_offset = [

      start_x / texture.width,

      start_y / texture.height,

      (start_x + width) / texture.width,

      (start_y + height) / texture.height
    ];

    this.saveMatrix();

    this.translateMatrix(x, y);

    if (texture.must_be_flipped) {

      texture.must_be_flipped = false;

      this.drawConsolidatedTexture(texture, texture_offset, undefined, true);

      texture.must_be_flipped = true;
    }
    else {

      this.drawConsolidatedTexture(texture, texture_offset, undefined, false);
    }

    this.restoreMatrix();
  }

  drawRotatedTexture(texture, center_x, center_y, draw_x, draw_y, theta) {

    this.saveMatrix();

    this.translateMatrix(draw_x, draw_y);

    this.rotateMatrix(theta);

    this.translateMatrix(-center_x, -center_y);

    this.drawConsolidatedTexture(texture, undefined, undefined);

    this.restoreMatrix();
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

    let tint_needs_updating = false;
    let use_texture_needs_updating = false;
    let texture_offset_needs_updating = false;

    if (this.cache.tint != "" + color.r + color.g + color.b + color.a) {

      tint_needs_updating = true;
    }

    let texture_offset = [0, 0, 1, 1];

    let i = 0;

    for (i; i < 4; ++i) {

      if (this.cache.texture_offset[i] != texture_offset[i]) {

        texture_offset_needs_updating = true;

        break;
      }
    }

    if (tint_needs_updating) {

      // Upload the tint.
      this.canvas.context.uniform4fv(this.locations.u_tint, [color.r, color.g, color.b, color.a]);

      // Cache the tint for next time.
      this.cache.tint = "" + color.r + color.g + color.b + color.a;
    }

    if (this.cache.use_texture == true) {

      use_texture_needs_updating = true;
    }

    if (use_texture_needs_updating) {

      this.canvas.context.uniform1i(this.locations.u_use_texture, false);

      this.cache.use_texture = false;
    }

    this.saveMatrix();

    this.translateMatrix(begin_x, begin_y);

    let width = 0;
    let height = 0;

    if (end_x > begin_x) {

      width = end_x - begin_x;
    }
    else {

      width = -begin_x + end_x;
    }

    if (end_y > begin_y) {

      height = end_y - begin_y;
    }
    else {

      height = -begin_y + end_y;
    }

    // Scale the rectangle to its proper resolution.
    this.scaleMatrix(width / this.target.width, height / this.target.height);

    // Upload the transformation matrix.
    this.canvas.context.uniformMatrix3fv(this.locations.u_matrix, false, this.matrix_stack[this.matrix_stack.length - 1]);

    this.restoreMatrix();

    if (texture_offset_needs_updating) {

      this.canvas.context.uniform4fv(this.locations.u_texture_offset, [0, 0, 1, 1]);

      this.cache.texture_offset = texture_offset;
    }

    if (this.cache.flip_texture_offset == true) {

      this.canvas.context.uniform1i(this.locations.u_flip_texture_offset, false);

      this.cache.flip_texture_offset = false;
    }

    this.canvas.context.drawArrays(this.canvas.context.TRIANGLE_FAN, 0, 4);
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

  scaleMatrix(scale_x, scale_y) {

    let scaled_matrix = [

      scale_x, 0.0, 0.0,

      0.0, scale_y, 0.0,

      0.0, 0.0, 1.0
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], scaled_matrix);

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  rotateMatrix(theta) {

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

  translateMatrix(translate_x, translate_y) {

    let translated_matrix = [

      1.0, 0.0, 0.0,

      0.0, 1.0, 0.0,

      translate_x, translate_y, 1.0
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], translated_matrix);

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  multiplyMatrices(a, b) {

    let multiplied_matrix = this.getIdentityMatrix();

    multiplied_matrix[0] = a[0] * b[0] + a[3] * b[1] + a[6] * b[2];
    multiplied_matrix[3] = a[0] * b[3] + a[3] * b[4] + a[6] * b[5];
    multiplied_matrix[6] = a[0] * b[6] + a[3] * b[7] + a[6] * b[8];

    multiplied_matrix[1] = a[1] * b[0] + a[4] * b[1] + a[7] * b[2];
    multiplied_matrix[4] = a[1] * b[3] + a[4] * b[4] + a[7] * b[5];
    multiplied_matrix[7] = a[1] * b[6] + a[4] * b[7] + a[7] * b[8];

    multiplied_matrix[2] = a[2] * b[0] + a[5] * b[1] + a[8] * b[2];
    multiplied_matrix[5] = a[2] * b[3] + a[5] * b[4] + a[8] * b[5];
    multiplied_matrix[8] = a[2] * b[6] + a[5] * b[7] + a[8] * b[8];

    return multiplied_matrix;
  }

  createTexture(width, height) {

    let frame_buffer = this.canvas.context.createFramebuffer();

    let texture = this.canvas.context.createTexture();

    this.canvas.context.bindTexture(this.canvas.context.TEXTURE_2D, texture);

    this.canvas.context.texImage2D(this.canvas.context.TEXTURE_2D, 0, this.canvas.context.RGBA, width, height, 0, this.canvas.context.RGBA, this.canvas.context.UNSIGNED_BYTE, null);

    this.canvas.context.texParameteri(this.canvas.context.TEXTURE_2D, this.canvas.context.TEXTURE_WRAP_S, this.canvas.context.CLAMP_TO_EDGE);
    this.canvas.context.texParameteri(this.canvas.context.TEXTURE_2D, this.canvas.context.TEXTURE_WRAP_T, this.canvas.context.CLAMP_TO_EDGE);

    this.canvas.context.texParameteri(this.canvas.context.TEXTURE_2D, this.canvas.context.TEXTURE_MIN_FILTER, this.texture_flags.filtering);
    this.canvas.context.texParameteri(this.canvas.context.TEXTURE_2D, this.canvas.context.TEXTURE_MAG_FILTER, this.texture_flags.filtering);

    this.canvas.context.bindFramebuffer(this.canvas.context.FRAMEBUFFER, frame_buffer);

    this.canvas.context.framebufferTexture2D(this.canvas.context.FRAMEBUFFER, this.canvas.context.COLOR_ATTACHMENT0, this.canvas.context.TEXTURE_2D, texture, 0);

    this.canvas.context.bindFramebuffer(this.canvas.context.FRAMEBUFFER, null);

    return {

      width: width,

      height: height,

      texture: texture,

      frame_buffer: frame_buffer,

      must_be_flipped: true
    };
  }

  setTargetTexture(frame_buffer) {

    // @TODO: Cache this.

    // Prevent feed-back loops when drawing into new textures.
    this.cache.texture = undefined;

    this.canvas.context.bindFramebuffer(this.canvas.context.FRAMEBUFFER, frame_buffer.frame_buffer);

    if (frame_buffer.frame_buffer == null) {

      this.target.width = this.canvas.width;
      this.target.height = this.canvas.height;
    }
    else {

      this.target.width = frame_buffer.width;
      this.target.height = frame_buffer.height;
    }

    // Update the vertex buffer.
    this.setUniformsAndAttributes();

    // Update the viewport to reflect the new target size.
    this.canvas.context.viewport(0, 0, this.target.width, this.target.height);
  }

  getDefaultTarget() {

    return {

      width: 0,

      height: 0,

      texture: null,

      frame_buffer: null
    };
  }
};
