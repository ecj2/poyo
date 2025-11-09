"use strict";

let Poyo = new class {

  constructor() {

    this.cache = {

      tint: [],
      texture: 0,
      texture_offset: []
    };

    this.mouse = {

      x: 0,
      y: 0,
      z: 0,

      scale_x: 1,
      scale_y: 1,

      offset_x: 0,
      offset_y: 0,

      down: [],
      pressed: [],
      released: [],

      focused: false
    };

    this.keyboard = {

      key: "",

      code: 0,

      down: [],
      pressed: [],
      released: []
    };

    this.canvas = {

      canvas: undefined,

      width: 0,
      height: 0
    };

    this.target = {

      width: 0,
      height: 0
    };

    this.audio = {

      context: undefined,

      instance_offset: 0,

      instances: []
    };

    this.time_initialized = undefined;

    this.version = 3;

    this.shader_program = undefined;
    this.uniforms = {};

    this.matrix = this.createTransform();

    this.WebGL2 = undefined;

    this.errors = [];

    this.texture_filtering = {

      minification: undefined,
      magnification: undefined
    };

    this.use_instancing = false;

    this.instanced_tint_buffer = undefined;
    this.instanced_drawing_buffer = undefined;

    this.instanced_tint_buffer_data = [];
    this.instanced_drawing_buffer_data = [];

    this.instanced_bitmap = undefined;

    this.number_of_instances = 0;

    this.batch_text = false;

    this.font = {

      bitmap: undefined,

      canvas: undefined,

      context: undefined
    };

    this.texture_wrap_s = undefined;
    this.texture_wrap_t = undefined;

    this.initializeConstants();

    this.bitmap_reference_counter = 0;

    this.final_frame = undefined;

    this.draw_targets = [];
  }

  initializeConstants() {

    // Mouse codes.
    this.MOUSE_ANY = 3;
    this.MOUSE_LEFT = 0;
    this.MOUSE_RIGHT = 2;
    this.MOUSE_MIDDLE = 1;

    // Keyboard codes.
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
    this.KEY_UP = 38;
    this.KEY_ESC = 27;
    this.KEY_ANY = 98;
    this.KEY_DOWN = 40;
    this.KEY_LEFT = 37;
    this.KEY_RIGHT = 39;
    this.KEY_SPACE = 32;

    // Font alignment.
    this.ALIGN_LEFT = "left";
    this.ALIGN_RIGHT = "right";
    this.ALIGN_CENTER = "center";

    // Font styles.
    this.STYLE_BOLD = "bold";
    this.STYLE_ITALIC = "italic";
    this.STYLE_NORMAL = "normal";
    this.STYLE_BOLD_ITALIC = "bold italic";

    // Texture filtering.
    this.MIN_LINEAR = 0;
    this.MAG_LINEAR = 1;
    this.MIN_NEAREST = 2;
    this.MAG_NEAREST = 3;

    // Texture wrapping.
    this.WRAP_CLAMP = 4;
    this.WRAP_REPEAT = 5;
    this.WRAP_MIRROR = 6;
  }

  getErrors() {

    return this.errors;
  }

  getLastError() {

    return this.errors[this.errors.length - 1];
  }

  displayError(message, show_alert = true) {

    if (show_alert) {

      alert(`Error: ${message}!`);
    }

    throw new Error(message + "!");
  }

  initialize(canvas_w, canvas_h) {

    // Set the time in which the library was initialized.
    this.time_initialized = Date.now();

    this.audio.context = new AudioContext();

    this.canvas.canvas = document.getElementById("poyo");

    if (this.canvas.canvas === null) {

      this.errors.push("missing canvas element");

      return;
    }

    this.canvas.width = canvas_w;
    this.canvas.height = canvas_h;

    this.target.width = canvas_w;
    this.target.height = canvas_h;

    // Set canvas dimensions to match interal resolution.
    this.canvas.canvas.width = canvas_w;
    this.canvas.canvas.height = canvas_h;

    this.WebGL2 = this.canvas.canvas.getContext(

      "webgl2",

      {

        alpha: false,

        depth: false,

        antialias: false,

        powerPreference: "high-performance",

        preserveDrawingBuffer: false,

        failIfMajorPerformanceCaveat: true
      }
    );

    if (this.WebGL2 === null) {

      this.errors.push("browser lacks WebGL 2 support");

      return;
    }

    this.WebGL2.enable(this.WebGL2.SCISSOR_TEST);

    // Use nearest filtering and repeat textures.
    this.setNewBitmapFlags(this.MIN_NEAREST, this.MAG_NEAREST, this.WRAP_REPEAT);

    // Set default blend mode.
    this.WebGL2.enable(this.WebGL2.BLEND);
    this.WebGL2.blendFunc(this.WebGL2.SRC_ALPHA, this.WebGL2.ONE_MINUS_SRC_ALPHA);

    if (!this.createShadersAndPrograms()) {

      this.errors.push("failed to create shaders and program");

      return false;
    }

    if (!this.getUniformLocations()) {

      this.errors.push("failed to get uniform locations");

      return false;
    }

    this.setUniformsAndAttributes();

    this.instanced_tint_buffer = this.WebGL2.createBuffer();
    this.instanced_drawing_buffer = this.WebGL2.createBuffer();

    this.font.bitmap = this.createBitmap(canvas_w, canvas_h);

    this.font.canvas = document.createElement("canvas");
    this.font.context = this.font.canvas.getContext("2d");

    this.font.canvas.width = canvas_w;
    this.font.canvas.height = canvas_h;

    this.final_frame = this.createBitmap(canvas_w, canvas_h);

    // Listen for mouse events.
    this.canvas.canvas.addEventListener("wheel", this.manageMouseEvents.bind(this));
    this.canvas.canvas.addEventListener("mouseup", this.manageMouseEvents.bind(this));
    this.canvas.canvas.addEventListener("mouseout", this.manageMouseEvents.bind(this));
    this.canvas.canvas.addEventListener("mouseover", this.manageMouseEvents.bind(this));
    this.canvas.canvas.addEventListener("mousedown", this.manageMouseEvents.bind(this));
    this.canvas.canvas.addEventListener("mousemove", this.manageMouseEvents.bind(this));
    this.canvas.canvas.addEventListener("contextmenu", this.manageMouseEvents.bind(this));

    // Listen for keyboard events.
    document.addEventListener("keyup", this.manageKeyboardEvents.bind(this));
    document.addEventListener("keydown", this.manageKeyboardEvents.bind(this));

    return true;
  }

  createShadersAndPrograms() {

    let vertex_shader_source = `

      #version 300 es

      layout(location = 0) in vec2 a_vertex_position;
      layout(location = 1) in vec4 a_instance_tint;
      layout(location = 2) in vec3 a_instance_matrix_part_1;
      layout(location = 3) in vec3 a_instance_matrix_part_2;
      layout(location = 4) in vec4 a_instance_texture_offset;

      uniform mat3 u_matrix;

      uniform vec2 u_resolution;

      uniform vec4 u_tint;
      uniform vec4 u_texture_offset;

      uniform bool u_instance;

      out vec2 v_texture_position;

      out vec4 v_tint;

      void main(void) {

        float use_instancing = float(u_instance);

        mat3 matrix;

        matrix[0][0] = mix(u_matrix[0][0], a_instance_matrix_part_1[0], use_instancing);
        matrix[1][0] = mix(u_matrix[1][0], a_instance_matrix_part_2[2], use_instancing);
        matrix[2][0] = mix(u_matrix[2][0], a_instance_matrix_part_1[1], use_instancing);
        matrix[0][1] = mix(u_matrix[0][1], a_instance_matrix_part_2[1], use_instancing);
        matrix[1][1] = mix(u_matrix[1][1], a_instance_matrix_part_2[0], use_instancing);
        matrix[2][1] = mix(u_matrix[2][1], a_instance_matrix_part_1[2], use_instancing);

        v_tint = mix(u_tint, a_instance_tint, use_instancing);

        vec4 texture_offset = mix(u_texture_offset, a_instance_texture_offset, use_instancing);

        // Scale and translate texture position.
        v_texture_position = (a_vertex_position / u_resolution) * texture_offset.zw + texture_offset.st;

        // Convert pixel coordinates to normalized device coordinates.
        vec2 clip_space_position = vec2(matrix * vec3(a_vertex_position, 1.0)).xy / u_resolution * 2.0 - 1.0;

        gl_Position = vec4(clip_space_position, 0.0, 1.0);
      }
    `;

    let fragment_shader_source = `

      #version 300 es

      precision mediump float;

      in vec2 v_texture_position;

      in vec4 v_tint;

      uniform sampler2D u_texture;

      out vec4 final_color;

      void main(void) {

        final_color = texture(u_texture, v_texture_position) * v_tint;
      }
    `;

    let vertex_shader = this.createShader(vertex_shader_source, this.WebGL2.VERTEX_SHADER);
    let fragment_shader = this.createShader(fragment_shader_source, this.WebGL2.FRAGMENT_SHADER);

    this.shader_program = this.createProgram(vertex_shader, fragment_shader);

    return !!vertex_shader && !!fragment_shader && !!this.shader_program;
  }

  createShader(source, type) {

    let shader = this.WebGL2.createShader(type);

    this.WebGL2.shaderSource(shader, source.trim());

    this.WebGL2.compileShader(shader);

    if (!this.WebGL2.getShaderParameter(shader, this.WebGL2.COMPILE_STATUS)) {

      this.errors.push("shader failed to compile: " + this.WebGL2.getShaderInfoLog(shader));

      return false;
    }

    return shader;
  }

  createProgram(vertex_shader, fragment_shader) {

    let program = this.WebGL2.createProgram();

    try {

      this.WebGL2.attachShader(program, vertex_shader);
      this.WebGL2.attachShader(program, fragment_shader);
    }
    catch (exception) {

      this.errors.push("failed to attach shader");

      return;
    }

    this.WebGL2.linkProgram(program);

    if (!this.WebGL2.getProgramParameter(program, this.WebGL2.LINK_STATUS)) {

      this.errors.push("failed to link shaders");

      return false;
    }

    // The compiled shaders are not needed after being linked.
    this.WebGL2.deleteShader(vertex_shader);
    this.WebGL2.deleteShader(fragment_shader);

    return program;
  }

  getUniformLocations() {

    this.uniforms.u_tint = this.WebGL2.getUniformLocation(this.shader_program, "u_tint");
    this.uniforms.u_matrix = this.WebGL2.getUniformLocation(this.shader_program, "u_matrix");
    this.uniforms.u_texture = this.WebGL2.getUniformLocation(this.shader_program, "u_texture");
    this.uniforms.u_instance = this.WebGL2.getUniformLocation(this.shader_program, "u_instance");
    this.uniforms.u_resolution = this.WebGL2.getUniformLocation(this.shader_program, "u_resolution");
    this.uniforms.u_texture_offset = this.WebGL2.getUniformLocation(this.shader_program, "u_texture_offset");

    let key = undefined;

    for (key in this.uniforms) {

      if (this.uniforms[key] === null) {

        // Failed to find location of a uniform.
        return false;
      }
    }

    return true;
  }

  setUniformsAndAttributes() {

    this.WebGL2.useProgram(this.shader_program);

    let buffer = this.WebGL2.createBuffer();

    let w = this.target.width;
    let h = this.target.height;

    let buffer_data = new Float32Array([0, 0, w, 0, w, h, 0, h]);

    this.WebGL2.bindBuffer(this.WebGL2.ARRAY_BUFFER, buffer);
    this.WebGL2.bufferData(this.WebGL2.ARRAY_BUFFER, buffer_data, this.WebGL2.STATIC_DRAW);

    this.WebGL2.vertexAttribPointer(0, 2, this.WebGL2.FLOAT, false, 0, 0);
    this.WebGL2.enableVertexAttribArray(0);

    // Upload the target's resolution.
    this.WebGL2.uniform2fv(this.uniforms.u_resolution, [w, h]);

    // Restrict the viewport to the target's resolution.
    this.WebGL2.viewport(0, 0, w, h);

    // Scissor beyond the target's resolution.
    this.setClippingRectangle(0, 0, w, h);
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

        this.mouse.down[event.button] = false;
        this.mouse.released[event.button] = true;
      break;

      case "mouseout":

        this.mouse.focused = false;
      break;

      case "mouseover":

        this.mouse.focused = true;
      break;

      case "mousedown":

        if (!this.mouse.down[event.button]) {

          this.mouse.pressed[event.button] = true;
        }

        this.mouse.down[event.button] = true;
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

    event.preventDefault();
  }

  isMouseFocused() {

    return this.mouse.focused;
  }

  isMouseUp(button) {

    if (button === this.MOUSE_ANY) {

      for (let i = 0; i < 3; ++i) {

        if (!this.mouse.down[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.mouse.down[button];
  }

  isMouseDown(button) {

    if (button === this.MOUSE_ANY) {

      for (let i = 0; i < 3; ++i) {

        if (this.mouse.down[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.down[button];
  }

  isMousePressed(button) {

    if (button === this.MOUSE_ANY) {

      for (let i = 0; i < 3; ++i) {

        if (this.mouse.pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.pressed[button];
  }

  isMouseReleased(button) {

    if (button === this.MOUSE_ANY) {

      for (let i = 0; i < 3; ++i) {

        if (this.mouse.released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.released[button];
  }

  setMouseScale(scale_x, scale_y) {

    this.mouse.scale_x = scale_x;
    this.mouse.scale_y = scale_y;
  }

  setMouseOffset(x, y) {

    this.mouse.offset_x = x;
    this.mouse.offset_y = y;
  }

  getMouseX() {

    return (this.mouse.x + this.mouse.offset_x) * this.mouse.scale_x;
  }

  getMouseY() {

    return (this.mouse.y + this.mouse.offset_y) * this.mouse.scale_y;
  }

  getMouseWheel() {

    return this.mouse.z;
  }

  hideMouse() {

    this.canvas.canvas.style.cursor = "none";
  }

  showMouse() {

    this.canvas.canvas.style.cursor = "auto";
  }

  isMouseHidden() {

    return this.canvas.canvas.style.cursor === "none";
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

    return document.pointerLockElement === this.getCanvas();
  }

  manageKeyboardEvents(event) {

    switch (event.type) {

      case "keyup":

        this.keyboard.down[event.which] = false;
        this.keyboard.released[event.which] = true;
      break;

      case "keydown":

        if (!this.keyboard.down[event.which]) {

          this.keyboard.pressed[event.which] = true;
        }

        this.keyboard.down[event.which] = true;

        this.keyboard.key = event.key;
        this.keyboard.code = event.which;
      break;
    }

    if (event.which === 32 || event.which === 38 || event.which === 40 || event.which === 37 || event.which === 39) {

      // Prevent arrow keys and space bar from scrolling page.
      event.preventDefault();
    }
  }

  isKeyUp(key) {

    if (key === this.KEY_ANY) {

      for (let i = 0; i < 255; ++i) {

        if (!this.keyboard.down[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.keyboard.down[key];
  }

  isKeyDown(key) {

    if (key === this.KEY_ANY) {

      for (let i = 0; i < 255; ++i) {

        if (this.keyboard.down[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.down[key];
  }

  isKeyPressed(key) {

    if (key === this.KEY_ANY) {

      for (let i = 0; i < 255; ++i) {

        if (this.keyboard.pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.pressed[key];
  }

  isKeyReleased(key) {

    if (key === this.KEY_ANY) {

      for (let i = 0; i < 255; ++i) {

        if (this.keyboard.released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.released[key];
  }

  getKey() {

    return this.keyboard.key;
  }

  getKeyCode() {

    return this.keyboard.code;
  }

  getCanvas() {

    return this.canvas.canvas;
  }

  getContext() {

    return this.WebGL2;
  }

  clearToColor(color) {

    this.WebGL2.clearColor(color.r / 255, color.g / 255, color.b / 255, color.a / 255);

    this.WebGL2.clear(this.WebGL2.COLOR_BUFFER_BIT);
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

    // Create a new final frame to match the new dimensions.
    this.final_frame = this.createBitmap(this.canvas.width, this.canvas.height);
  }

  setCanvasHeight(height) {

    this.canvas.height = height;
    this.target.height = height;
    this.canvas.canvas.height = height;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();

    // Create a new final frame to match the new dimensions.
    this.final_frame = this.createBitmap(this.canvas.width, this.canvas.height);
  }

  getCanvasWidth() {

    return this.canvas.width;
  }

  getCanvasHeight() {

    return this.canvas.height;
  }

  getTargetWidth() {

    return this.target.width;
  }

  getTargetHeight() {

    return this.target.height;
  }

  saveTransform(t) {

    this.pushTransform(t);
  }

  restoreTransform(t) {

    this.popTransform(t);
    this.useTransform(t);
  }

  pushTransform(t) {

    t.stack.push(t.value);
  }

  popTransform(t) {

    t.value = t.stack.pop();

    if (t.value === undefined) {

      t.value = this.getIdentityTransform();
    }

    if (t.stack.length === 0) {

      t.stack[0] = this.getIdentityTransform();
    }
  }

  getVersion() {

    return this.version;
  }

  createGameLoop(procedure) {

    let then = performance.now();

    let animation_request = () => {

      window.requestAnimationFrame(animation_request);

      let now = performance.now();

      // Limit loop to a maximum of 60 calls per second.
      if (now - then >= 1000 / 60) {

        // Clear draw targets array each frame.
        this.draw_targets = [];

        then = now - (now - then) % (1000 / 60);

        this.pushTransform(this.matrix);

        this.setDrawTarget(this.final_frame);

        // Draw the procedure to the final frame.
        procedure();

        this.setDrawTarget(null);

        // Vertically flip the final frame and draw it.
        this.drawScaledBitmap(this.final_frame, 0, 0, 1, -1, 0, this.canvas.height);

        // Reset matrix each frame.
        this.popTransform(this.matrix);

        this.clearInputArrays();
      }
    };

    window.requestAnimationFrame(animation_request);
  }

  clearInputArrays() {

    for (let i = 0; i < 3; ++i) {

      // Clear mouse button arrays so each mouse button event fires only once.
      this.mouse.pressed[i] = false;
      this.mouse.released[i] = false;

      // Reset scroll wheel value each frame.
      this.mouse.z = 0;
    }

    for (let i = 0; i < 255; ++i) {

      // Clear key arrays so each keyboard event fires only once.
      this.keyboard.pressed[i] = false;
      this.keyboard.released[i] = false;
    }
  }

  createColor(r, g, b, a = 255) {

    return {r: r, g: g, b: b, a: a};
  }

  loadFont(path, style = this.STYLE_NORMAL) {

    return fetch(path).then(

      (response) => {

        if (response.status === 200) {

          let element = document.createElement("style");
          let font_name = "font_" + Math.random().toString(16).slice(2);

          element.textContent = `

            @font-face {

              font-family: "${font_name}";
              src: url("${path}");
            }
          `;

          document.head.appendChild(element);

          return this.loadFontFace(font_name, style);
        }
        else {

          this.errors.push(`failed to load ${path}`);

          return false;
        }
      }
    );
  }

  loadFontFace(font_family_name, style = this.STYLE_NORMAL) {

    let font = {

      name: font_family_name,

      style: style
    };

    // Pre-load the font.
    this.drawText(font, this.createColor(0, 0, 0, 0), 0, 0, 0, this.ALIGN_LEFT, "");

    return font;
  }

  async loadBitmapFont(path, grid_w, grid_h, rows, sequence) {

    if (sequence === undefined) {

      sequence = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
    }

    let bitmap = await this.loadBitmap(path);

    if (!bitmap) {

      return false;
    }

    let font_bitmap = {

      bitmap: bitmap,

      grid_width: grid_w,
      grid_height: grid_h,

      rows: rows - 1,

      data: {}
    };

    let row = 0;
    let column = 0;

    for (let i = 0; i < sequence.length; ++i) {

      font_bitmap.data[sequence[i]] = {

        x: row,

        y: column
      };

      ++row;

      if (row > font_bitmap.rows) {

        ++column;

        row = 0;
      }
    }

    return font_bitmap;
  }

  drawBitmapFont(bitmap_font, color, size, x, y, alignment, text) {

    // Ensure the text is a string.
    text = "" + text;

    // Properly scale to desired size.
    size /= bitmap_font.grid_height;

    let lines = text.split("\n");

    this.useInstancing(true);

    for (let i = 0; i < lines.length; ++i) {

      let draw_x = 0;
      let draw_y = 0;

      let start_x = 0;
      let start_y = 0;

      for (let j = 0; j < lines[i].length; ++j) {

        let character = lines[i][j];

        let data = bitmap_font.data[character];

        if (data === undefined) {

          // This character isn't included in the sequence.
          continue;
        }

        // Texture offsets.
        start_x = data.x * bitmap_font.grid_width;
        start_y = data.y * bitmap_font.grid_height;

        draw_x = bitmap_font.grid_width * size * j + x;
        draw_y = bitmap_font.grid_height * size * i + y;

        this.pushTransform(this.matrix);

        switch (alignment) {

          case this.ALIGN_CENTER:

            this.translateTransform(this.matrix, -lines[i].length / 2 * bitmap_font.grid_width * size, 0);
          break;

          case this.ALIGN_RIGHT:

            this.translateTransform(this.matrix, -lines[i].length * bitmap_font.grid_width * size, 0);
          break;
        }

        this.translateTransform(this.matrix, draw_x, draw_y);

        this.scaleTransform(this.matrix, size, size);

        this.useTransform(this.matrix);

        // Draw each character.
        this.drawClippedBitmap(bitmap_font.bitmap, start_x, start_y, bitmap_font.grid_width, bitmap_font.grid_height, 0, 0, color);

        this.popTransform(this.matrix);
      }
    }

    this.useInstancing(false);
  }

  drawText(font, color, size, x, y, alignment, text) {

    if (this.use_instancing) {

      this.batch_text = true;
    }

    if (this.font.canvas.width != this.target.width || this.font.canvas.height != this.target.height) {

      // The target's dimensions changed; resize font bitmap and canvas to match.

      this.font.bitmap.width = this.target.width;
      this.font.bitmap.height = this.target.height;

      this.font.canvas.width = this.target.width;
      this.font.canvas.height = this.target.height;
    }

    let r = color.r;
    let g = color.g;
    let b = color.b;
    let a = color.a / 255;

    // Set font properties.
    this.font.context.textAlign = alignment;
    this.font.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    this.font.context.font = `${font.style} ${size}px ${font.name}`;

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, x, y + size);

    let t = this.matrix.value;

    this.font.context.save();

    this.font.context.transform(t[0], -t[3], -t[1], t[4], t[6], t[7]);

    this.popTransform(this.matrix);

    // Draw the text to the canvas.
    this.font.context.fillText(text, 0, 0);

    this.font.context.restore();

    if (!this.use_instancing) {

      this.actuallyDrawText();
    }
  }

  actuallyDrawText() {

    // Use the font canvas' contents as a texture.
    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, this.font.bitmap.texture);
    this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA8, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, this.font.canvas);

    this.pushTransform(this.matrix);

    // Transformations were applied to the text canvas, not to the final bitmap.
    this.useTransform(this.createTransform());

    // Draw the font bitmap.
    this.drawBitmap(this.font.bitmap, 0, 0);

    this.popTransform(this.matrix);

    // Clear the font canvas.
    this.font.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  loadSample(path, max_instances = 1) {

    let element = document.createElement("audio");

    if (!!!element.canPlayType("audio/" + path.split(".").pop())) {

      // The browser can not play this audio format.
      return false;
    }

    element.src = path;

    // Pre-load audio files. This fixes a bug in Firefox which may arise when loading big samples.
    element.preload = "auto";

    let reject_function = undefined;
    let resolve_function = undefined;

    let min = this.audio.instance_offset;

    this.audio.instance_offset += max_instances;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let sample = {

            element: element,

            instance_min: min,
            instance_max: min + max_instances,

            instance_counter: min
          };

          resolve(sample);
        };

        reject_function = () => {

          this.errors.push(`failed to load ${path}`);

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

  playSample(sample, gain, speed, pan, repeat, reference) {

    if (reference === undefined) {

      reference = sample.instance_counter;
    }

    if (this.audio.instances[reference] === undefined) {

      // Create a new instance of the sample.

      let element_clone = sample.element.cloneNode();

      let track = this.audio.context.createMediaElementSource(element_clone);

      this.audio.instances[reference] = {

        element: element_clone,

        track: track,

        panner: this.audio.context.createStereoPanner()
      };
    }

    let instance = this.audio.instances[reference];

    instance.track.connect(instance.panner).connect(this.audio.context.destination);

    if (!this.isSamplePlaying(reference)) {

      this.adjustSample(reference, gain, speed, pan, repeat);
    }

    ++sample.instance_counter;

    if (sample.instance_counter >= sample.instance_max) {

      sample.instance_counter = sample.instance_min;
    }

    instance.element.play();
  }

  adjustSample(reference, gain, speed, pan, repeat) {

    this.audio.instances[reference].element.loop = repeat;
    this.audio.instances[reference].element.volume = gain;
    this.audio.instances[reference].panner.pan.value = this.clamp(pan, -1, 1);;
    this.audio.instances[reference].element.playbackRate = speed;
  }

  stopSample(reference) {

    if (this.isSamplePlaying(reference)) {

      this.pauseSample(reference);

      this.audio.instances[reference].element.currentTime = 0;
    }
  }

  pauseSample(reference) {

    if (this.isSamplePlaying(reference)) {

      this.audio.instances[reference].element.pause();
    }
  }

  resumeSample(reference) {

    this.audio.instances[reference].element.play();
  }

  isSamplePaused(reference) {

    if (this.audio.instances[reference] === undefined) {

      // There exists no sample instance matching the specified reference.
      return false;
    }

    return this.audio.instances[reference].element.paused;
  }

  isSamplePlaying(reference) {

    if (this.audio.instances[reference] === undefined) {

      // There exists no sample instance matching the specified reference.
      return false;
    }

    if (this.isSamplePaused(reference)) {

      return false;
    }

    if (this.audio.instances[reference].element.currentTime < this.audio.instances[reference].element.duration) {

      return true;
    }

    return false;
  }

  getSamplePan(reference) {

    return this.audio.instances[reference].panner.pan.value;
  }

  getSampleSpeed(reference) {

    return this.audio.instances[reference].element.playbackRate;
  }

  getSampleGain(reference) {

    return this.audio.instances[reference].element.volume;
  }

  getSampleRepeat(reference) {

    return this.audio.instances[reference].element.loop;
  }

  getSampleDuration(sample) {

    return sample.element.duration;
  }

  getSampleSeek(reference) {

    return this.audio.instances[reference].element.currentTime;
  }

  setSampleSeek(reference, seek) {

    this.audio.instances[reference].element.currentTime = seek;
  }

  useInstancing(toggle) {

    if (!toggle) {

      if (this.use_instancing) {

        if (this.batch_text) {

          this.batch_text = false;
          this.use_instancing = false;

          this.actuallyDrawText();

          return;
        }

        // Drawing was being held, but now it's time to draw.
        this.drawInstancedBitmaps();

        // Clear the buffers for next time.
        this.instanced_tint_buffer_data = [];
        this.instanced_drawing_buffer_data = [];

        this.number_of_instances = 0;
      }
    }

    this.use_instancing = toggle;
  }

  loadBitmap(path) {

    let element = new Image();

    element.src = path;
    element.crossOrigin = "anonymous";

    let reject_function = undefined;
    let resolve_function = undefined;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let bitmap = this.createBitmap(element.width, element.height);

          // Use the image's contents as a texture.
          this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, bitmap.texture);
          this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA8, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, element);

          resolve(bitmap);
        };

        reject_function = () => {

          this.errors.push(`failed to load ${path}`);

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

  setNewBitmapFlags(...flags) {

    flags.forEach(

      (flag) => {

        switch (flag) {

          case this.MIN_LINEAR:

            this.texture_filtering.minification = this.WebGL2.LINEAR;
          break;

          case this.MAG_LINEAR:

            this.texture_filtering.magnification = this.WebGL2.LINEAR;
          break;

          case this.MIN_NEAREST:

            this.texture_filtering.minification = this.WebGL2.NEAREST;
          break;

          case this.MAG_NEAREST:

            this.texture_filtering.magnification = this.WebGL2.NEAREST;
          break;

          case this.WRAP_CLAMP:

            this.texture_wrap_s = this.WebGL2.CLAMP_TO_EDGE;
            this.texture_wrap_t = this.WebGL2.CLAMP_TO_EDGE;
          break;

          case this.WRAP_REPEAT:

            this.texture_wrap_s = this.WebGL2.REPEAT;
            this.texture_wrap_t = this.WebGL2.REPEAT;
          break;

          case this.WRAP_MIRROR:

            this.texture_wrap_s = this.WebGL2.MIRRORED_REPEAT;
            this.texture_wrap_t = this.WebGL2.MIRRORED_REPEAT;
          break;
        }
      }
    );
  }

  getBitmapWidth(bitmap) {

    return bitmap.width;
  }

  getBitmapHeight(bitmap) {

    return bitmap.height;
  }

  getBitmapTexture(bitmap) {

    return bitmap.texture;
  }

  getBitmapFramebuffer(bitmap) {

    return bitmap.framebuffer;
  }

  drawInstancedBitmaps() {

    // Don't attempt to draw anything if the buffer data is empty.
    if (this.instanced_drawing_buffer_data.length === 0) return;

    if (this.cache.texture != this.instanced_bitmap.reference) {

      // Set the active texture.
      this.WebGL2.activeTexture(this.WebGL2.TEXTURE0);
      this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, this.instanced_bitmap.texture);
      this.WebGL2.uniform1i(this.uniforms.u_texture, 0);

      // Cache the texture reference for next time.
      this.cache.texture = this.instanced_bitmap.reference;
    }

    this.WebGL2.bindBuffer(this.WebGL2.ARRAY_BUFFER, this.instanced_tint_buffer);
    this.WebGL2.bufferData(this.WebGL2.ARRAY_BUFFER, new Uint8Array(this.instanced_tint_buffer_data), this.WebGL2.STATIC_DRAW);

    // Tints.
    this.WebGL2.vertexAttribPointer(1, 4, this.WebGL2.UNSIGNED_BYTE, true, 4, 0);
    this.WebGL2.vertexAttribDivisor(1, 1);
    this.WebGL2.enableVertexAttribArray(1);

    this.WebGL2.bindBuffer(this.WebGL2.ARRAY_BUFFER, this.instanced_drawing_buffer);
    this.WebGL2.bufferData(this.WebGL2.ARRAY_BUFFER, new Float32Array(this.instanced_drawing_buffer_data), this.WebGL2.STATIC_DRAW);

    // Matrices part 1.
    this.WebGL2.vertexAttribPointer(2, 3, this.WebGL2.FLOAT, false, 4 * 10, 0);
    this.WebGL2.vertexAttribDivisor(2, 1);
    this.WebGL2.enableVertexAttribArray(2);

    // Matrices part 2.
    this.WebGL2.vertexAttribPointer(3, 3, this.WebGL2.FLOAT, false, 4 * 10, 12);
    this.WebGL2.vertexAttribDivisor(3, 1);
    this.WebGL2.enableVertexAttribArray(3);

    // Texture offsets.
    this.WebGL2.vertexAttribPointer(4, 4, this.WebGL2.FLOAT, false, 4 * 10, 24);
    this.WebGL2.vertexAttribDivisor(4, 1);
    this.WebGL2.enableVertexAttribArray(4);

    // Tell the shader we're using instancing.
    this.WebGL2.uniform1i(this.uniforms.u_instance, true);

    // Draw the instanced bitmaps.
    this.WebGL2.drawArraysInstanced(this.WebGL2.TRIANGLE_FAN, 0, 4, this.number_of_instances);

    // Tell the shader we're done using instancing.
    this.WebGL2.uniform1i(this.uniforms.u_instance, false);
  }

  addBitmapInstance(bitmap, offsets = [0, 0, 1, 1], tint = this.createColor(255, 255, 255)) {

    this.instanced_bitmap = bitmap;

    // Scale instanced bitmap to its proper resolution.
    this.scaleTransform(this.matrix, offsets[2] * bitmap.width / this.target.width, offsets[3] * bitmap.height / this.target.height);

    this.instanced_tint_buffer_data.push(tint.r, tint.g, tint.b, tint.a);

    this.instanced_drawing_buffer_data.push(

      this.matrix.value[0], this.matrix.value[6], this.matrix.value[7],
      this.matrix.value[4], this.matrix.value[1], this.matrix.value[3],

      offsets[0], offsets[1], offsets[2], offsets[3]
    );

    ++this.number_of_instances;
  }

  drawConsolidatedBitmap(bitmap, texture_offset = [0, 0, 1, 1], tint = this.createColor(255, 255, 255)) {

    let t = tint;
    let c = this.cache.tint;

    if (c[0] != t.r || c[1] != t.g || c[2] != t.b || c[3] != t.a)  {

      // Upload the tint.
      this.WebGL2.uniform4fv(this.uniforms.u_tint, [tint.r / 255, tint.g / 255, tint.b / 255, tint.a / 255]);

      // Cache the tint for next time.
      this.cache.tint = [t.r, t.g, t.b, t.a];
    }

    if (this.cache.texture != bitmap.reference) {

      // Set the active texture.
      this.WebGL2.activeTexture(this.WebGL2.TEXTURE0);
      this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, bitmap.texture);
      this.WebGL2.uniform1i(this.uniforms.u_texture, 0);

      // Cache the texture reference for next time.
      this.cache.texture = bitmap.reference;
    }

    for (let i = 0; i < 4; ++i) {

      if (this.cache.texture_offset[i] != texture_offset[i]) {

        // Upload the texture offset.
        this.WebGL2.uniform4fv(this.uniforms.u_texture_offset, texture_offset);

        // Cache the texture offset for next time.
        this.cache.texture_offset = texture_offset;

        break;
      }
    }

    this.pushTransform(this.matrix);

    // Scale the bitmap to its proper resolution.
    this.scaleTransform(this.matrix, texture_offset[2] * bitmap.width / this.target.width, texture_offset[3] * bitmap.height / this.target.height);

    // Upload the transformation matrix.
    this.WebGL2.uniformMatrix3fv(this.uniforms.u_matrix, false, this.matrix.value);

    this.popTransform(this.matrix);

    // Draw the bitmap.
    this.WebGL2.drawArrays(this.WebGL2.TRIANGLE_FAN, 0, 4);
  }

  drawBitmap(bitmap, x, y, tint) {

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, x, y);

    if (this.use_instancing) {

      this.addBitmapInstance(bitmap, undefined, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, undefined, tint);
    }

    this.popTransform(this.matrix);
  }

  drawScaledBitmap(bitmap, origin_x, origin_y, scale_x, scale_y, draw_x, draw_y, tint) {

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, draw_x, draw_y);
    this.scaleTransform(this.matrix, scale_x, scale_y);
    this.translateTransform(this.matrix, -origin_x, -origin_y);

    if (this.use_instancing) {

      this.addBitmapInstance(bitmap, undefined, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, undefined, tint);
    }

    this.popTransform(this.matrix);
  }

  drawClippedBitmap(bitmap, start_x, start_y, width, height, x, y, tint) {

    let texture_offset = [

      start_x / bitmap.width,

      start_y / bitmap.height,

      width / bitmap.width,

      height / bitmap.height
    ];

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, x, y);

    if (this.use_instancing) {

      this.addBitmapInstance(bitmap, texture_offset, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, texture_offset, tint);
    }

    this.popTransform(this.matrix);
  }

  drawRotatedBitmap(bitmap, center_x, center_y, draw_x, draw_y, theta, tint) {

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, draw_x, draw_y);
    this.rotateTransform(this.matrix, theta);
    this.translateTransform(this.matrix, -center_x, -center_y);

    if (this.use_instancing) {

      this.addBitmapInstance(bitmap, undefined, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, undefined, tint);
    }

    this.popTransform(this.matrix);
  }

  getIdentityTransform() {

    return [

      1, 0, 0,

      0, 1, 0,

      0, 0, 1
    ];
  }

  createTransform() {

    return {

      value: this.getIdentityTransform(),

      stack: []
    };
  }

  useTransform(t) {

    this.matrix.value = t.value;
  }

  scaleTransform(t, scale_x, scale_y) {

    let scaled_matrix = [

      scale_x, 0, 0,

      0, scale_y, 0,

      0, 0, 1
    ];

    t.value = this.multiplyMatrices(t.value, scaled_matrix);
  }

  rotateTransform(t, theta) {

    let sine = Math.sin(theta);
    let cosine = Math.cos(theta);

    let rotated_matrix = [

      cosine, sine, 0,

      -sine, cosine, 0,

      0, 0, 1
    ];

    t.value = this.multiplyMatrices(t.value, rotated_matrix);
  }

  translateTransform(t, x, y) {

    let translated_matrix = [

      1, 0, 0,

      0, 1, 0,

      x | 0, y | 0, 1
    ];

    t.value = this.multiplyMatrices(t.value, translated_matrix);
  }

  shearTransform(t, theta_x, theta_y) {

    let sheared_matrix = [

      1, Math.atan(theta_y), 0,

      -Math.atan(theta_x), 1, 0,

      0, 0, 1
    ];

    t.value = this.multiplyMatrices(t.value, sheared_matrix);
  }

  multiplyMatrices(a, b) {

    let multiplied_matrix = this.getIdentityTransform();

    multiplied_matrix[0] = a[0] * b[0] + a[3] * b[1];
    multiplied_matrix[3] = a[0] * b[3] + a[3] * b[4];
    multiplied_matrix[6] = a[0] * b[6] + a[3] * b[7] + a[6];

    multiplied_matrix[1] = a[1] * b[0] + a[4] * b[1];
    multiplied_matrix[4] = a[1] * b[3] + a[4] * b[4];
    multiplied_matrix[7] = a[1] * b[6] + a[4] * b[7] + a[7];

    return multiplied_matrix;
  }

  createBitmap(w, h) {

    let framebuffer = this.WebGL2.createFramebuffer();

    let texture = this.WebGL2.createTexture();

    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, texture);
    this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA8, w, h, 0, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, null);

    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_WRAP_S, this.texture_wrap_s);
    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_WRAP_T, this.texture_wrap_t);
    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_MIN_FILTER, this.texture_filtering.minification);
    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_MAG_FILTER, this.texture_filtering.magnification);

    this.WebGL2.bindFramebuffer(this.WebGL2.FRAMEBUFFER, framebuffer);

    this.WebGL2.framebufferTexture2D(this.WebGL2.FRAMEBUFFER, this.WebGL2.COLOR_ATTACHMENT0, this.WebGL2.TEXTURE_2D, texture, 0);

    // Prevent feed-back loops between framebuffer and active texture.
    this.WebGL2.bindFramebuffer(this.WebGL2.FRAMEBUFFER, null);

    // Clear texture cache to force a re-bind.
    this.cache.texture = undefined;

    return {

      width: w,

      height: h,

      texture: texture,

      framebuffer: framebuffer,

      reference: ++this.bitmap_reference_counter
    };
  }

  setDrawTarget(bitmap) {

    this.draw_targets.push(bitmap);

    // Prevent feed-back loops when drawing into new textures.
    this.cache.texture = undefined;
    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, null);

    let framebuffer = bitmap ? bitmap.framebuffer : null;

    this.WebGL2.bindFramebuffer(this.WebGL2.FRAMEBUFFER, framebuffer);

    if (framebuffer === null) {

      this.target.width = this.canvas.width;
      this.target.height = this.canvas.height;
    }
    else {

      this.target.width = bitmap.width;
      this.target.height = bitmap.height;
    }

    // Update the vertex buffer.
    this.setUniformsAndAttributes();
  }

  revertDrawTarget() {

    // Get the last target from the array.
    let target = this.draw_targets.pop();

    if (this.draw_targets.length > 0) {

      // Get parent target.
      target = this.draw_targets.pop();
    }

    this.setDrawTarget(target);
  }

  getDefaultDrawTarget() {

    return this.final_frame;
  }

  clearCache() {

    // Reset cache to defaults.
    this.cache = {

      tint: [],
      texture: 0,
      texture_offset: []
    };

    // Revert to default shader program and draw target.
    this.setDrawTarget(this.getDefaultDrawTarget());
  }

  setClippingRectangle(x, y, w, h) {

    this.WebGL2.scissor(x, y, w, h);
  }

  createBoundingBox(x, y, w, h) {

    return {

      x: x,
      y: y,

      w: w,
      h: h
    };
  }

  isColliding(a, b) {

    // AABB collision.
    return a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h;
  }

  clamp(x, min, max) {

    return Math.max(min, Math.min(max, x));
  }
};
