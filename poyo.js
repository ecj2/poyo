"use strict";

let Poyo = new class {

  constructor() {

    this.cache = {};

    this.mouse = {

      x: 0,

      y: 0,

      z: 0,

      down: [],

      pressed: [],

      released: [],

      focused: false
    };

    this.keyboard = {

      down: [],

      pressed: [],

      released: []
    };

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

    this.ALIGN_LEFT = "left";
    this.ALIGN_RIGHT = "right";
    this.ALIGN_CENTER = "center";

    this.STYLE_BOLD = "bold";
    this.STYLE_ITALIC = "italic";
    this.STYLE_NORMAL = "normal";
    this.STYLE_BOLD_ITALIC = "bold italic";

    this.canvas = {

      canvas: undefined,

      width: 0,

      height: 0
    };

    this.target = {

      width: 0,

      height: 0
    };

    this.time_initialized = undefined;

    this.sample_instances = [];

    this.version = 2;

    this.shader_program = undefined;
    this.uniforms = [];

    this.matrix = this.createTransform();
    this.texture_matrix = this.createTransform();

    this.WebGL2 = undefined;

    this.errors = [];

    this.texture_filtering = {

      minification: undefined,

      magnification: undefined
    };

    this.batch_drawing = false;

    this.instanced_drawing_buffer = undefined;
    this.instanced_drawing_buffer_data = [];

    this.instanced_bitmap = undefined;

    this.batch_text = false;

    this.font = {

      bitmap: undefined,

      canvas: undefined,

      context: undefined
    };

    this.texture_wrap_s = undefined;
    this.texture_wrap_t = undefined;

    this.MIN_LINEAR = 0;
    this.MAG_LINEAR = 1;
    this.MIN_NEAREST = 2;
    this.MAG_NEAREST = 3;

    this.WRAP_CLAMP = 4;
    this.WRAP_REPEAT = 5;
    this.WRAP_MIRROR = 6;

    this.MODE_VERTEX = 0;
    this.MODE_TEXTURE = 1;

    this.transform_mode = this.MODE_VERTEX;

    this.fix_bespoke_transformations = true;
  }

  getErrors() {

    return this.errors;
  }

  displayError(message) {

    alert(`Error: ${message}!`);

    throw new Error(message + "!");
  }

  initialize(canvas_width, canvas_height) {

    // Set the time in which the library was initialized.
    this.time_initialized = Date.now();

    this.cache = {

      tint: "",

      texture: undefined,

      texture_offset: [],

      font_bitmap: undefined,

      font_canvas: undefined,

      font_canvas_context: undefined,

      texture_resolution: [],

      flip_vertical_reject: false
    };

    this.canvas.canvas = document.getElementById("poyo");

    if (this.canvas.canvas == null) {

      this.errors.push("missing canvas element");

      return;
    }

    this.canvas.width = canvas_width;
    this.canvas.height = canvas_height;

    this.target.width = canvas_width;
    this.target.height = canvas_height;

    // Set canvas dimensions to match interal resolution.
    this.canvas.canvas.width = this.canvas.width;
    this.canvas.canvas.height = this.canvas.height;

    this.WebGL2 = this.canvas.canvas.getContext(

      "webgl2",

      {

        alpha: false,

        depth: false,

        antialias: false,

        powerPreference: "high-performance",

        preserveDrawingBuffer: true,

        failIfMajorPerformanceCaveat: true
      }
    );

    if (this.WebGL2 == null) {

      this.errors.push("browser lacks WebGL 2 support");

      return;
    }

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

    this.instanced_drawing_buffer = this.WebGL2.createBuffer();

    this.font.bitmap = this.createBitmap(this.target.width, this.target.height);
    this.font.bitmap.must_be_flipped = false;

    this.font.canvas = document.createElement("canvas");
    this.font.context = this.font.canvas.getContext("2d");

    this.font.canvas.width = this.target.width;
    this.font.canvas.height = this.target.height;

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
      layout(location = 1) in vec2 a_texture_position;

      layout(location = 2) in vec4 a_instance_tint;
      layout(location = 3) in vec3 a_instance_matrix_part_1;
      layout(location = 4) in vec3 a_instance_matrix_part_2;
      layout(location = 5) in vec2 a_instance_texture_offset;

      uniform mat3 u_matrix;

      uniform vec2 u_resolution;

      uniform bool u_instance;

      out vec2 v_texture_position;

      out vec4 v_instance_tint;
      out vec2 v_instance_texture_offset;

      void main(void) {

        mat3 matrix = u_matrix;
        vec2 position = a_vertex_position;

        if (u_instance) {

          matrix[0][0] = a_instance_matrix_part_1[0];
          matrix[1][0] = a_instance_matrix_part_2[2];
          matrix[2][0] = a_instance_matrix_part_1[1];
          matrix[0][1] = a_instance_matrix_part_2[1];
          matrix[1][1] = a_instance_matrix_part_2[0];
          matrix[2][1] = a_instance_matrix_part_1[2];

          v_instance_tint = a_instance_tint;
          v_instance_texture_offset = a_instance_texture_offset;
        }

        // Convert pixel coordinates to normalized device coordinates.
        vec2 clip_space_position = vec2(matrix * vec3(position, 1.0)).xy / u_resolution * 2.0 - 1.0;

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

      uniform bool u_instance;
      uniform bool u_flip_vertical_reject;

      uniform sampler2D u_texture;

      uniform vec2 u_texture_offset;

      in vec4 v_instance_tint;
      in vec2 v_instance_texture_offset;

      uniform mat3 u_texture_matrix;
      uniform vec2 u_texture_resolution;

      out vec4 output_color;

      void main(void) {

        bool reject;

        vec2 position = v_texture_position;

        // Flip texture.
        position.t = 1.0 - position.t;

        vec4 tint = u_tint;
        vec2 texture_offset = u_texture_offset;

        if (u_instance) {

          tint = v_instance_tint;
          texture_offset = v_instance_texture_offset;
        }

        if (u_flip_vertical_reject) {

          reject = position.t < texture_offset[1] * -1.0 + 1.0;
        }
        else {

          reject = position.t > texture_offset[1];
        }

        reject = reject || position.s > texture_offset[0];

        mat3 matrix = u_texture_matrix;

        // Invert texture translations.
        matrix[2][0] *= -1.0;
        matrix[2][1] *= -1.0;

        // Convert pixel space to texture space.
        position = vec2(matrix * vec3(position, 1.0)) / u_texture_resolution;

        reject = reject || position.s < 0.0 || position.s > 1.0;
        reject = reject || position.t < 0.0 || position.t > 1.0;

        // Don't draw texels outside of the clipped offsets.
        if (reject) discard;

        output_color = texture(u_texture, position) * tint;
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

      this.errors.push("shader failed to compile");

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

    this.uniforms["u_tint"] = this.WebGL2.getUniformLocation(this.shader_program, "u_tint");
    this.uniforms["u_matrix"] = this.WebGL2.getUniformLocation(this.shader_program, "u_matrix");
    this.uniforms["u_texture"] = this.WebGL2.getUniformLocation(this.shader_program, "u_texture");
    this.uniforms["u_instance"] = this.WebGL2.getUniformLocation(this.shader_program, "u_instance");
    this.uniforms["u_resolution"] = this.WebGL2.getUniformLocation(this.shader_program, "u_resolution");
    this.uniforms["u_texture_matrix"] = this.WebGL2.getUniformLocation(this.shader_program, "u_texture_matrix");
    this.uniforms["u_texture_offset"] = this.WebGL2.getUniformLocation(this.shader_program, "u_texture_offset");
    this.uniforms["u_texture_resolution"] = this.WebGL2.getUniformLocation(this.shader_program, "u_texture_resolution");
    this.uniforms["u_flip_vertical_reject"] = this.WebGL2.getUniformLocation(this.shader_program, "u_flip_vertical_reject");

    let key = undefined;

    for (key in this.uniforms) {

      if (this.uniforms[key] == null) {

        // Failed to find location of a uniform.
        return false;
      }
    }

    return true;
  }

  setUniformsAndAttributes() {

    this.WebGL2.useProgram(this.shader_program);

    let buffer = this.WebGL2.createBuffer();

    let buffer_data = new Float32Array(

      [

        // Vertex data.

        0, 0,

        this.target.width, 0,

        this.target.width, this.target.height,

        0, this.target.height,

        // Texture data.

        0, 0,

        1, 0,

        1, 1,

        0, 1
      ]
    );

    this.WebGL2.bindBuffer(this.WebGL2.ARRAY_BUFFER, buffer);
    this.WebGL2.bufferData(this.WebGL2.ARRAY_BUFFER, buffer_data, this.WebGL2.STATIC_DRAW);

    this.WebGL2.vertexAttribPointer(0, 2, this.WebGL2.FLOAT, false, 0, 0);
    this.WebGL2.enableVertexAttribArray(0);

    this.WebGL2.vertexAttribPointer(1, 2, this.WebGL2.FLOAT, false, 0, 32);
    this.WebGL2.enableVertexAttribArray(1);

    // Upload the target's resolution.
    this.WebGL2.uniform2fv(this.uniforms["u_resolution"], [this.target.width, this.target.height]);

    // Restrict the viewport to the target's resolution.
    this.WebGL2.viewport(0, 0, this.target.width, this.target.height);
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

    if (button == this.MOUSE_ANY) {

      let i = 0;

      for (i; i < 3; ++i) {

        if (!this.mouse.down[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.mouse.down[button];
  }

  isMouseDown(button) {

    if (button == this.MOUSE_ANY) {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse.down[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.down[button];
  }

  isMousePressed(button) {

    if (button == this.MOUSE_ANY) {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse.pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.pressed[button];
  }

  isMouseReleased(button) {

    if (button == this.MOUSE_ANY) {

      let i = 0;

      for (i; i < 3; ++i) {

        if (this.mouse.released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.mouse.released[button];
  }

  getMouseX() {

    return this.mouse.x;
  }

  getMouseY() {

    return this.mouse.y;
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

        this.keyboard.down[event.which] = false;
        this.keyboard.released[event.which] = true;
      break;

      case "keydown":

        if (!this.keyboard.down[event.which]) {

          this.keyboard.pressed[event.which] = true;
        }

        this.keyboard.down[event.which] = true;
      break;
    }

    if (event.which == 38 || event.which == 40 || event.which == 37 || event.which == 39) {

      // Prevent arrow keys from scrolling page.
      event.preventDefault();
    }
  }

  isKeyUp(key) {

    if (key == this.KEY_ANY) {

      let i = 0;

      for (i; i < 99; ++i) {

        if (!this.keyboard.down[i]) {

          return true;
        }
      }

      return false;
    }

    return !this.keyboard.down[key];
  }

  isKeyDown(key) {

    if (key == this.KEY_ANY) {

      let i = 0;

      for (i; i < 99; ++i) {

        if (this.keyboard.down[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.down[key];
  }

  isKeyPressed(key) {

    if (key == this.KEY_ANY) {

      let i = 0;

      for (i; i < 99; ++i) {

        if (this.keyboard.pressed[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.pressed[key];
  }

  isKeyReleased(key) {

    if (key == this.KEY_ANY) {

      let i = 0;

      for (i; i < 99; ++i) {

        if (this.keyboard.released[i]) {

          return true;
        }
      }

      return false;
    }

    return this.keyboard.released[key];
  }

  getCanvas() {

    return this.canvas.canvas;
  }

  getContext() {

    return this.WebGL2;
  }

  clearToColor(color) {

    this.WebGL2.clearColor(color.r, color.g, color.b, color.a);

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
  }

  setCanvasHeight(height) {

    this.canvas.height = height;
    this.target.height = height;
    this.canvas.canvas.height = height;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();
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

  saveTransform(transform) {

    this.pushTransform(transform);
  }

  restoreTransform(transform) {

    this.popTransform(transform);
    this.useTransform(transform);
  }

  pushTransform(transform) {

    transform.stack.push(transform.value);
  }

  popTransform(transform) {

    transform.value = transform.stack.pop();

    if (transform.value == undefined) {

      transform.value = this.getIdentityTransform();
    }

    if (transform.stack.length == 0) {

      transform.stack[0] = this.getIdentityTransform();
    }
  }

  getVersion() {

    return this.version;
  }

  createGameLoop(loop_procedure) {

    let then = performance.now();

    let animation_request = () => {

      window.requestAnimationFrame(animation_request);

      let now = performance.now();

      if (now - then >= 1000 / 60) {

        then = now - (now - then) % (1000 / 60);

        this.pushTransform(this.matrix);
        this.pushTransform(this.texture_matrix);

        // Flip the canvas right-side-up.
        this.scaleTransform(this.matrix, 1, -1);
        this.translateTransform(this.matrix, 0, -this.target.height);

        loop_procedure();

        // Reset matrices each frame.
        this.popTransform(this.matrix);
        this.popTransform(this.texture_matrix);

        this.clearInputArrays();
      }
    };

    window.requestAnimationFrame(animation_request);
  }

  clearInputArrays() {

    let i = 0;

    for (i; i < 3; ++i) {

      // Clear mouse button arrays so each mouse button event fires only once.
      this.mouse.pressed[i] = false;
      this.mouse.released[i] = false;

      // Reset scroll wheel value each frame.
      this.mouse.z = 0;
    }

    i = 0;

    for (i; i < 99; ++i) {

      // Clear key arrays so each keyboard event fires only once.
      this.keyboard.pressed[i] = false;
      this.keyboard.released[i] = false;
    }
  }

  createColor(r, g, b, a = 255) {

    return {r: r / 255, g: g / 255, b: b / 255, a: a / 255};
  }

  setEntryPoint(function_name) {

    // Call the specified function when the window loads.
    window.addEventListener(

      "load",

      () => {

        function_name();
      }
    );
  }

  loadFont(file_name, style = this.STYLE_NORMAL) {

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

  loadFontFace(font_family_name, style = this.STYLE_NORMAL) {

    let font = {

      name: font_family_name,

      style: style
    };

    // Pre-load the font.
    this.drawText(font, this.createColor(0, 0, 0, 0), 0, 0, 0, this.ALIGN_LEFT, "");

    return font;
  }

  drawText(font, color, size, x, y, alignment, text) {

    let cached_transform_mode = this.transform_mode;

    this.setTransformMode(this.MODE_TEXTURE);

    if (this.batch_drawing) {

      this.batch_text = true;
    }

    if (this.font.canvas.width != this.target.width || this.font.canvas.height != this.target.height) {

      // Resize font bitmap and canvas.

      this.font.bitmap.width = this.target.width;
      this.font.bitmap.height = this.target.height;

      this.font.canvas.width = this.target.width;
      this.font.canvas.height = this.target.height;
    }

    let r = color.r * 255;
    let g = color.g * 255;
    let b = color.b * 255;
    let a = color.a;

    // Set font properties.
    this.font.context.textAlign = alignment;
    this.font.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    this.font.context.font = `${font.style} ${size}px ${font.name}`;

    this.pushTransform(this.matrix);

    this.setTransformMode(this.MODE_VERTEX);

    // Flip text right-side-up.
    this.scaleTransform(this.matrix, 1, -1);
    this.translateTransform(this.matrix, x, y + size);

    this.translateTransform(this.matrix, 0, -this.target.height);

    let t = this.matrix.value;

    this.font.context.save();

    this.font.context.transform(t[0], -t[3], -t[1], t[4], t[6], t[7]);

    this.popTransform(this.matrix);

    // Draw the text to the canvas.
    this.font.context.fillText(text, 0, 0);

    this.font.context.restore();

    if (!this.batch_drawing) {

      this.actuallyDrawText();
    }

    this.setTransformMode(cached_transform_mode);
  }

  actuallyDrawText() {

    // Use the font canvas' contents as a texture.
    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, this.font.bitmap.texture);
    this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, this.font.canvas);

    this.pushTransform(this.matrix);

    // Transformations were applied to the text canvas, not to the final bitmap.
    this.useTransform(this.createTransform());

    this.pushTransform(this.texture_matrix);

    // Prevent texture transformations from messing with drawing text.
    this.texture_matrix.value = this.getIdentityTransform();

    // Draw the font bitmap.
    this.drawBitmap(this.font.bitmap, 0, 0);

    this.popTransform(this.texture_matrix);

    this.popTransform(this.matrix);

    // Clear the font canvas.
    this.font.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  loadSample(file_name) {

    let element = document.createElement("audio");

    if (!!!element.canPlayType("audio/" + file_name.split(".").pop())) {

      // The browser can not play this audio format.
      return false;
    }

    element.src = file_name;

    // Pre-load audio files. This fixes a bug in Firefox which may arise when loading big samples.
    element.preload = "auto";

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

  playSample(sample, gain, speed, repeat, reference) {

    if (this.sample_instances[reference] == undefined) {

      // Create a new instance of the sample.
      this.sample_instances[reference] = sample.element.cloneNode();
    }

    if (!this.isSamplePlaying(reference)) {

      this.adjustSample(reference, gain, speed, repeat);

      this.sample_instances[reference].play();
    }
  }

  adjustSample(reference, gain, speed, repeat) {

    if (this.sample_instances[reference] != undefined) {

      this.sample_instances[reference].loop = repeat;
      this.sample_instances[reference].volume = gain;
      this.sample_instances[reference].playbackRate = speed;
    }
  }

  stopSample(reference) {

    if (this.sample_instances[reference] != undefined) {

      if (this.isSamplePlaying(reference)) {

        this.pauseSample(reference);

        this.sample_instances[reference].currentTime = 0;
      }
    }
  }

  pauseSample(reference) {

    if (this.sample_instances[reference] != undefined) {

      if (this.isSamplePlaying(reference)) {

        this.sample_instances[reference].pause();
      }
    }
  }

  resumeSample(reference) {

    if (this.sample_instances[reference] != undefined) {

      this.sample_instances[reference].play();
    }
  }

  isSamplePaused(reference) {

    if (this.sample_instances[reference] == undefined) {

      // There exists no sample instance matching the specified reference.
      return false;
    }

    return this.sample_instances[reference].paused;
  }

  isSamplePlaying(reference) {

    if (this.sample_instances[reference] == undefined) {

      // There exists no sample instance matching the specified reference.
      return false;
    }

    if (this.isSamplePaused(reference)) {

      return false;
    }

    if (this.sample_instances[reference].currentTime < this.sample_instances[reference].duration) {

      return true;
    }

    return false;
  }

  getSampleSpeed(reference) {

    return this.sample_instances[reference].playbackRate;
  }

  getSampleGain(reference) {

    return this.sample_instances[reference].volume;
  }

  getSampleRepeat(reference) {

    return this.sample_instances[reference].loop;
  }

  getSampleDuration(sample) {

    if (sample == undefined) {

      // Invalid sample.
      return 0;
    }

    return sample.element.duration;
  }

  getSampleSeek(reference) {

    if (this.sample_instances[reference] == undefined) {

      // Invalid sample.
      return 0;
    }

    return this.sample_instances[reference].currentTime;
  }

  setSampleSeek(reference, seek) {

    if (this.sample_instances[reference] != undefined) {

      this.sample_instances[reference].currentTime = seek;
    }
  }

  batchDrawing(batch) {

    if (!batch) {

      if (this.batch_drawing) {

        if (this.batch_text) {

          this.batch_text = false;
          this.batch_drawing = false;

          this.actuallyDrawText();

          return;
        }

        // Drawing was being held, but now it's time to draw.
        this.drawInstancedBitmaps(this.bitmap, undefined, undefined);

        // Clear the buffer for next time.
        this.instanced_drawing_buffer_data = [];
      }
    }

    this.batch_drawing = batch;
  }

  loadBitmap(file_name) {

    let element = new Image();

    element.src = file_name;

    let reject_function = undefined;
    let resolve_function = undefined;

    return new Promise(

      (resolve, reject) => {

        resolve_function = () => {

          let bitmap = this.createBitmap(element.width, element.height);

          // Use the image's contents as a texture.
          this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, bitmap.texture);
          this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, element);

          bitmap.must_be_flipped = false;

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

  setNewBitmapFlags(... flags) {

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
    if (this.instanced_drawing_buffer_data.length == 0) return;

    if (this.cache.texture != this.instanced_bitmap.texture) {

      // Set the active texture.
      this.WebGL2.activeTexture(this.WebGL2.TEXTURE0);
      this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, this.instanced_bitmap.texture);
      this.WebGL2.uniform1i(this.uniforms["u_texture"], 0);

      // Cache the texture for next time.
      this.cache.texture = this.instanced_bitmap.texture;
    }

    this.WebGL2.bindBuffer(this.WebGL2.ARRAY_BUFFER, this.instanced_drawing_buffer);
    this.WebGL2.bufferData(this.WebGL2.ARRAY_BUFFER, new Float32Array(this.instanced_drawing_buffer_data), this.WebGL2.STATIC_DRAW);

    // Tints.
    this.WebGL2.vertexAttribPointer(2, 4, this.WebGL2.FLOAT, false, 4 * 14, 40);
    this.WebGL2.vertexAttribDivisor(2, 1);
    this.WebGL2.enableVertexAttribArray(2);

    // Matrices part 1.
    this.WebGL2.vertexAttribPointer(3, 3, this.WebGL2.FLOAT, false, 4 * 14, 0);
    this.WebGL2.vertexAttribDivisor(3, 1);
    this.WebGL2.enableVertexAttribArray(3);

    // Matrices part 2.
    this.WebGL2.vertexAttribPointer(4, 3, this.WebGL2.FLOAT, false, 4 * 14, 12);
    this.WebGL2.vertexAttribDivisor(4, 1);
    this.WebGL2.enableVertexAttribArray(4);

    // Texture offsets.
    this.WebGL2.vertexAttribPointer(5, 4, this.WebGL2.FLOAT, false, 4 * 14, 24);
    this.WebGL2.vertexAttribDivisor(5, 1);
    this.WebGL2.enableVertexAttribArray(5);

    if (this.cache.instance != this.batch_drawing) {

      this.WebGL2.uniform1i(this.uniforms["u_instance"], this.batch_drawing);

      this.cache.instance = this.batch_drawing;
    }

    let flip_it = this.instanced_bitmap.must_be_flipped && !this.cache.flip_texture_offset;

    if (flip_it) {

      // Flip the texture offsets.
      this.WebGL2.uniform1i(this.uniforms["u_flip_texture_offset"], true);
    }

    this.WebGL2.drawArraysInstanced(this.WebGL2.TRIANGLE_FAN, 0, 4, this.instanced_drawing_buffer_data.length / 14);

    if (flip_it) {

      // Flip texture offsets back without affecting cache.
      this.WebGL2.uniform1i(this.uniforms["u_flip_texture_offset"], false);
    }

    // @TODO: Make texture transformations work in batches.
    // @TODO: Make batches work again after the past few commits broke them.
  }

  addBitmapInstance(bitmap, offsets = [0, 0, 1, 1], tint = this.createColor(255, 255, 255)) {

    this.instanced_bitmap = bitmap;

    // Cache the current transform mode.
    let cached_transform_mode = this.transform_mode;

    // Use vertex mode to prevent contamination from texture transformations.
    this.setTransformMode(this.MODE_VERTEX);

    // Scale instanced bitmap to its proper resolution.
    this.scaleTransform(this.matrix, bitmap.width / this.target.width, bitmap.height / this.target.height);

    // Return to the previous transform mode.
    this.setTransformMode(cached_transform_mode);

    this.instanced_drawing_buffer_data.push(

      this.matrix.value[0], this.matrix.value[6], this.matrix.value[7],

      this.matrix.value[4], this.matrix.value[1], this.matrix.value[3],

      offsets[0], offsets[1], offsets[2], offsets[3],

      tint.r, tint.g, tint.b, tint.a
    );
  }

  drawConsolidatedBitmap(bitmap, texture_offset = [0, 0, 1, 1], tint = this.createColor(255, 255, 255)) {

    if (this.cache.tint != "" + tint.r + tint.g + tint.b + tint.a) {

      // Upload the tint.
      this.WebGL2.uniform4fv(this.uniforms["u_tint"], [tint.r, tint.g, tint.b, tint.a]);

      // Cache the tint for next time.
      this.cache.tint = "" + tint.r + tint.g + tint.b + tint.a;
    }

    if (this.cache.texture != bitmap.texture) {

      // Set the active texture.
      this.WebGL2.activeTexture(this.WebGL2.TEXTURE0);
      this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, bitmap.texture);
      this.WebGL2.uniform1i(this.uniforms["u_texture"], 0);

      // Cache the texture for next time.
      this.cache.texture = bitmap.texture;
    }

    let i = 2;

    for (i; i < 4; ++i) {

      if (this.cache.texture_offset[i] != texture_offset[i]) {

        // Upload the texture offset.
        this.WebGL2.uniform2fv(this.uniforms["u_texture_offset"], [texture_offset[2], texture_offset[3]]);

        // Cache the texture offset for next time.
        this.cache.texture_offset = texture_offset;

        break;
      }
    }

    this.pushTransform(this.matrix);
    this.pushTransform(this.texture_matrix);

    let flip_vertical_reject = false;

    let vertical_offset = -texture_offset[1];

    if (bitmap.must_be_flipped) {

      // Flip textures right-side-up.
      this.scaleTransform(this.texture_matrix, 1, -1);
      this.translateTransform(this.texture_matrix, 0, bitmap.height);

      // Vertically flip vertices as well.
      this.scaleTransform(this.matrix, 1, -1);
      this.translateTransform(this.matrix, 0, -bitmap.height);

      flip_vertical_reject = true;

      vertical_offset *= -1;
    }

    // Offset texture.
    this.translateTransform(this.texture_matrix, -texture_offset[0], vertical_offset);

    if (this.cache.flip_vertical_reject != flip_vertical_reject) {

      this.WebGL2.uniform1i(this.uniforms["u_flip_vertical_reject"], flip_vertical_reject);

      this.cache.flip_vertical_reject = flip_vertical_reject;
    }

    if (this.cache.instance != this.batch_drawing) {

      this.WebGL2.uniform1i(this.uniforms["u_instance"], this.batch_drawing);

      this.cache.instance = this.batch_drawing;
    }

    let mode = this.transform_mode;

    this.setTransformMode(this.MODE_VERTEX);

    // Scale the bitmap to its proper resolution.
    this.scaleTransform(this.matrix, bitmap.width / this.target.width, bitmap.height / this.target.height);

    // Upload the transformation matrix.
    this.WebGL2.uniformMatrix3fv(this.uniforms["u_matrix"], false, this.matrix.value);

    this.popTransform(this.matrix);

    // Scale the texture so it appears properly.
    this.scaleTransform(this.texture_matrix, bitmap.width, bitmap.height);

    // Upload the texture transformation matrix.
    this.WebGL2.uniformMatrix3fv(this.uniforms["u_texture_matrix"], false, this.texture_matrix.value);

    this.popTransform(this.texture_matrix);

    if (bitmap.width != this.cache.texture_resolution[0] || bitmap.height != this.cache.texture_resolution[1]) {

      // Upload texture resolution.
      this.WebGL2.uniform2fv(this.uniforms["u_texture_resolution"], [bitmap.width, bitmap.height]);

      // Cache it for next time.
      this.cache.texture_resolution = [bitmap.width, bitmap.height];
    }

    this.setTransformMode(mode);

    // Draw the bitmap.
    this.WebGL2.drawArrays(this.WebGL2.TRIANGLE_FAN, 0, 4);
  }

  drawBitmap(bitmap, x, y, tint) {

    this.fix_bespoke_transformations = false;

    // Cache the current transform mode.
    let cached_transform_mode = this.transform_mode;

    // Use vertex mode to prevent contamination from texture transformations.
    this.setTransformMode(Poyo.MODE_VERTEX);

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, x, -y + this.target.height - bitmap.height);

    if (this.batch_drawing) {

      this.addBitmapInstance(bitmap, undefined, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, undefined, tint);
    }

    this.popTransform(this.matrix);

    // Return to the previous transform mode.
    this.setTransformMode(cached_transform_mode);

    this.fix_bespoke_transformations = true;
  }

  drawScaledBitmap(bitmap, origin_x, origin_y, scale_x, scale_y, draw_x, draw_y, tint) {

    this.fix_bespoke_transformations = false;

    // Cache the current transform mode.
    let cached_transform_mode = this.transform_mode;

    // Use vertex mode to prevent contamination from texture transformations.
    this.setTransformMode(Poyo.MODE_VERTEX);

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, draw_x, -draw_y + this.target.height - bitmap.height * scale_y);
    this.scaleTransform(this.matrix, scale_x, scale_y);
    this.translateTransform(this.matrix, -origin_x, origin_y);

    if (this.batch_drawing) {

      this.addBitmapInstance(bitmap, undefined, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, undefined, tint);
    }

    this.popTransform(this.matrix);

    // Return to the previous transform mode.
    this.setTransformMode(cached_transform_mode);

    this.fix_bespoke_transformations = true;
  }

  drawClippedBitmap(bitmap, start_x, start_y, width, height, x, y, tint) {

    this.fix_bespoke_transformations = false;

    let texture_offset = [

      start_x,

      start_y,

      width / bitmap.width,

      height / bitmap.height
    ];

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, x, -y + this.target.height - bitmap.height);

    if (this.batch_drawing) {

      this.addBitmapInstance(bitmap, texture_offset, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, texture_offset, tint);
    }

    this.popTransform(this.matrix);

    this.fix_bespoke_transformations = true;
  }

  drawRotatedBitmap(bitmap, center_x, center_y, draw_x, draw_y, theta, tint) {

    this.fix_bespoke_transformations = false;

    // Cache the current transform mode.
    let cached_transform_mode = this.transform_mode;

    // Use vertex mode to prevent contamination from texture transformations.
    this.setTransformMode(Poyo.MODE_VERTEX);

    this.pushTransform(this.matrix);

    this.translateTransform(this.matrix, draw_x, -draw_y + this.target.height);
    this.rotateTransform(this.matrix, theta);
    this.translateTransform(this.matrix, -center_x, -bitmap.height + center_y);

    if (this.batch_drawing) {

      this.addBitmapInstance(bitmap, undefined, tint);
    }
    else {

      this.drawConsolidatedBitmap(bitmap, undefined, tint);
    }

    this.popTransform(this.matrix);

    // Return to the previous transform mode.
    this.setTransformMode(cached_transform_mode);

    this.fix_bespoke_transformations = true;
  }

  getIdentityTransform() {

    return [

      1, 0, 0,

      0, 1, 0,

      0, 0, 1
    ]
  }

  createTransform() {

    return {

      value: this.getIdentityTransform(),

      stack: []
    };
  }

  useTransform(transform) {

    switch (this.transform_mode) {

      case this.MODE_TEXTURE:

        this.texture_matrix.value = transform.value;
      break;

      case this.MODE_VERTEX:

        this.pushTransform(transform);

        if (this.fix_bespoke_transformations) {

          this.scaleTransform(transform, 1, -1);
          this.translateTransform(transform, 0, -this.target.height);
        }

        this.matrix.value = transform.value;

        this.popTransform(transform);
      break;
    }
  }

  scaleTransform(transform, scale_x, scale_y) {

    if (this.transform_mode == this.MODE_TEXTURE) {

      // Fix scaling when applied to textures.
      scale_x = 1 / scale_x;
      scale_y = 1 / scale_y;
    }

    let scaled_matrix = [

      scale_x, 0, 0,

      0, scale_y, 0,

      0, 0, 1
    ];

    transform.value = this.multiplyMatrices(transform.value, scaled_matrix);
  }

  rotateTransform(transform, theta) {

    let direction = -1;

    if (this.fix_bespoke_transformations) {

      direction *= -1;
    }

    let sine = Math.sin(theta * direction);
    let cosine = Math.cos(theta * direction);

    let rotated_matrix = [

      cosine, sine, 0,

      -sine, cosine, 0,

      0, 0, 1
    ];

    transform.value = this.multiplyMatrices(transform.value, rotated_matrix);
  }

  translateTransform(transform, translate_x, translate_y) {

    let translated_matrix = [

      1, 0, 0,

      0, 1, 0,

      translate_x, translate_y, 1
    ];

    transform.value = this.multiplyMatrices(transform.value, translated_matrix);
  }

  shearTransform(transform, theta_x, theta_y) {

    let sheared_matrix = [

      1, Math.atan(theta_y), 0,

      -Math.atan(theta_x), 1, 0,

      0, 0, 1
    ];

    transform.value = this.multiplyMatrices(transform.value, sheared_matrix);
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

  setTransformMode(mode) {

    this.transform_mode = mode;
  }

  getTransformMode() {

    return this.transform_mode;
  }

  createBitmap(width, height) {

    let framebuffer = this.WebGL2.createFramebuffer();

    let texture = this.WebGL2.createTexture();

    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, texture);

    this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA, width, height, 0, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, null);

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

      width: width,

      height: height,

      texture: texture,

      framebuffer: framebuffer,

      must_be_flipped: true
    };
  }

  setDrawTarget(bitmap) {

    // Prevent feed-back loops when drawing into new textures.
    this.cache.texture = undefined;
    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, null);

    let framebuffer = bitmap ? bitmap.framebuffer : null;

    this.WebGL2.bindFramebuffer(this.WebGL2.FRAMEBUFFER, framebuffer);

    if (framebuffer == null) {

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

  getDefaultDrawTarget() {

    return null;
  }
};
