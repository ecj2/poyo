"use strict";

let Nini = new class {

  constructor() {

    this.cache = {};

    this.mouse = {

      x: 0,

      y: 0,

      z: 0,

      down: [],

      pressed: [],

      released: []
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
    this.KEY_Z = 90;
    this.KEY_X = 88;
    this.KEY_C = 67;
    this.KEY_V = 86;
    this.KEY_UP = 38;
    this.KEY_ESC = 27;
    this.KEY_ANY = 98;
    this.KEY_DOWN = 40;
    this.KEY_LEFT = 37;
    this.KEY_RIGHT = 39;

    this.canvas = {};
    this.target = {};

    this.time_initialized = undefined;

    this.sample_instances = [];

    this.version = 1;

    this.shader_program = undefined;
    this.locations = {};

    this.matrix_stack = [];

    this.WebGL2 = undefined;
  }

  initialize(canvas_identifier, canvas_width, canvas_height) {

    let canvas = document.createElement("canvas");

    if (!!!(canvas && canvas.getContext("webgl2"))) {

      // The browser does not support the canvas element or WebGL 2.
      return false;
    }

    // Set the time in which the library was initialized.
    this.time_initialized = Date.now();

    this.cache = {

      tint: "",

      texture: undefined,

      texture_offset: [],

      font_bitmap: undefined,

      font_canvas: undefined,

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

      width: canvas_width,

      height: canvas_height
    };

    this.WebGL2 = canvas.getContext(

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

    // Set default blend mode.
    this.WebGL2.enable(this.WebGL2.BLEND);
    this.WebGL2.blendFunc(this.WebGL2.SRC_ALPHA, this.WebGL2.ONE_MINUS_SRC_ALPHA);

    if (!this.createShadersAndPrograms()) {

      // Failed to create shaders and programs.
      return false;
    }

    if (!this.getUniformAndAttributeLocations()) {

      // Failed to get uniform and attribute locations.
      return false;
    }

    this.target = {

      width: canvas_width,

      height: canvas_height
    };

    this.setUniformsAndAttributes();

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
        discard_condition = discard_condition || texture_position.s < 0.0 || texture_position.s > u_texture_offset[2] || texture_position.s > 1.0;

        if (discard_condition) {

           // Don't draw texels outside of the beginning or ending offsets.
          discard;
        }

        output_color = texture(u_texture, texture_position) * u_tint;
      }
    `;

    let vertex_shader = this.createShader(vertex_shader_source.trim(), this.WebGL2.VERTEX_SHADER);

    let fragment_shader = this.createShader(fragment_shader_source.trim(), this.WebGL2.FRAGMENT_SHADER);

    this.shader_program = this.createProgram(vertex_shader, fragment_shader);

    return !!vertex_shader && !!fragment_shader && !!this.shader_program;
  }

  createShader(source, type) {

    let shader = this.WebGL2.createShader(type);

    this.WebGL2.shaderSource(shader, source);

    this.WebGL2.compileShader(shader);

    if (!this.WebGL2.getShaderParameter(shader, this.WebGL2.COMPILE_STATUS)) {

      // The shader failed to compile.
      return false;
    }

    return shader;
  }

  createProgram(vertex_shader, fragment_shader) {

    let program = this.WebGL2.createProgram();

    this.WebGL2.attachShader(program, vertex_shader);
    this.WebGL2.attachShader(program, fragment_shader);

    this.WebGL2.linkProgram(program);

    if (!this.WebGL2.getProgramParameter(program, this.WebGL2.LINK_STATUS)) {

      // The program failed to link the two shaders.
      return false;
    }

    // The compiled shaders are not needed after being linked.
    this.WebGL2.deleteShader(vertex_shader);
    this.WebGL2.deleteShader(fragment_shader);

    return program;
  }

  getUniformAndAttributeLocations() {

    this.locations.a_vertex_position = this.WebGL2.getAttribLocation(this.shader_program, "a_vertex_position");
    this.locations.a_texture_position = this.WebGL2.getAttribLocation(this.shader_program, "a_texture_position");

    this.locations.u_tint = this.WebGL2.getUniformLocation(this.shader_program, "u_tint");
    this.locations.u_matrix = this.WebGL2.getUniformLocation(this.shader_program, "u_matrix");
    this.locations.u_texture = this.WebGL2.getUniformLocation(this.shader_program, "u_texture");
    this.locations.u_texture_offset = this.WebGL2.getUniformLocation(this.shader_program, "u_texture_offset");
    this.locations.u_canvas_resolution = this.WebGL2.getUniformLocation(this.shader_program, "u_canvas_resolution");
    this.locations.u_flip_texture_offset = this.WebGL2.getUniformLocation(this.shader_program, "u_flip_texture_offset");

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

    this.WebGL2.vertexAttribPointer(this.locations.a_vertex_position, 2, this.WebGL2.FLOAT, false, 0, 0);
    this.WebGL2.enableVertexAttribArray(this.locations.a_vertex_position);

    this.WebGL2.vertexAttribPointer(this.locations.a_texture_position, 2, this.WebGL2.FLOAT, false, 0, 32);
    this.WebGL2.enableVertexAttribArray(this.locations.a_texture_position);

    // Upload the target's resolution.
    this.WebGL2.uniform2fv(this.locations.u_canvas_resolution, [this.target.width, this.target.height]);

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

    if (event.type == "wheel" || event.which == 3) {

      // Prevent default event when scrolling the wheel or right-clicking.
      event.preventDefault();
    }
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

    // Clear font bitmap cache.
    this.cache.font_bitmap = undefined;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();
  }

  setCanvasHeight(height) {

    this.canvas.height = height;
    this.target.height = height;
    this.canvas.canvas.height = height;

    // Clear font bitmap cache.
    this.cache.font_bitmap = undefined;

    // Update the vertex buffer.
    this.setUniformsAndAttributes();
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

  createGameLoop(update_function, render_function, update_interval = 60) {

    setInterval(

      (() => {

        update_function();

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
      }).bind(this),

      1000 / update_interval
    );

    let animation_request = () => {

      window.requestAnimationFrame(animation_request);

      render_function();
    };

    window.requestAnimationFrame(animation_request);
  }

  makeColor(r, g, b, a = 255) {

    return {r: r / 255, g: g / 255, b: b / 255, a: a / 255};
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
    this.drawText(font, this.makeColor(0, 0, 0, 0), 0, 0, 0, "left", "");

    return font;
  }

  drawText(font, color, size, x, y, alignment, text) {

    if (this.cache.font_bitmap == undefined) {

      this.cache.font_canvas = document.createElement("canvas");

      // Match the canvas for text-drawing to that of the main canvas' dimensions.
      this.cache.font_canvas.width = this.canvas.width;
      this.cache.font_canvas.height = this.canvas.height;

      // Use the Canvas 2D context to handle drawing text.
      this.cache.font_canvas_context = this.cache.font_canvas.getContext("2d");

      this.cache.font_bitmap = this.createBitmap(this.canvas.width, this.canvas.height);

      this.cache.font_bitmap.must_be_flipped = false;
    }

    // Clear the canvas.
    this.cache.font_canvas_context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set font properties.
    this.cache.font_canvas_context.textAlign = alignment;
    this.cache.font_canvas_context.fillStyle = "rgba(255, 255, 255, 1)";
    this.cache.font_canvas_context.font = `${font.style} ${size}px ${font.name}`;

    // Draw the text to the canvas.
    this.cache.font_canvas_context.fillText(text, x, y + size);

    // Use the font canvas' contents as a texture.
    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, this.cache.font_bitmap.texture);
    this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, this.cache.font_canvas);

    // Draw the font bitmap.
    this.drawTintedBitmap(this.cache.font_bitmap, color, 0, 0);
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

  drawConsolidatedBitmap(bitmap, texture_offset = [0, 0, 1, 1], tint = this.makeColor(255, 255, 255), flip_texture_offset = false) {

    if (this.cache.tint != "" + tint.r + tint.g + tint.b + tint.a) {

      // Upload the tint.
      this.WebGL2.uniform4fv(this.locations.u_tint, [tint.r, tint.g, tint.b, tint.a]);

      // Cache the tint for next time.
      this.cache.tint = "" + tint.r + tint.g + tint.b + tint.a;
    }

    if (this.cache.texture != bitmap.texture) {

      // Set the active texture.
      this.WebGL2.activeTexture(this.WebGL2.TEXTURE0);
      this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, bitmap.texture);
      this.WebGL2.uniform1i(this.locations.u_texture, 0);

      // Cache the texture for next time.
      this.cache.texture = bitmap.texture;
    }

    let i = 0;

    for (i; i < 4; ++i) {

      if (this.cache.texture_offset[i] != texture_offset[i]) {

        // Upload the texture offset.
        this.WebGL2.uniform4fv(this.locations.u_texture_offset, texture_offset);

        // Cache the texture offset for next time.
        this.cache.texture_offset = texture_offset;

        break;
      }
    }

    if (this.cache.flip_texture_offset != flip_texture_offset) {

      // Flip the texture offset.
      this.WebGL2.uniform1i(this.locations.u_flip_texture_offset, flip_texture_offset);

      // Cache this for next time.
      this.cache.flip_texture_offset = flip_texture_offset;
    }

    this.saveMatrix();

    if (bitmap.must_be_flipped) {

      // Flip framebuffer textures right-side up.
      this.scaleMatrix(1, -1);
      this.translateMatrix(0, -bitmap.height);
    }

    // Scale the bitmap to its proper resolution.
    this.scaleMatrix(bitmap.width / this.target.width, bitmap.height / this.target.height);

    // Upload the transformation matrix.
    this.WebGL2.uniformMatrix3fv(this.locations.u_matrix, false, this.matrix_stack[this.matrix_stack.length - 1]);

    this.restoreMatrix();

    // Draw the bitmap.
    this.WebGL2.drawArrays(this.WebGL2.TRIANGLE_FAN, 0, 4);
  }

  drawBitmap(bitmap, x, y) {

    this.saveMatrix();

    this.translateMatrix(x, y);

    this.drawConsolidatedBitmap(bitmap, undefined, undefined);

    this.restoreMatrix();
  }

  drawScaledBitmap(bitmap, origin_x, origin_y, scale_width, scale_height, draw_x, draw_y) {

    this.saveMatrix();

    this.translateMatrix(draw_x, draw_y);

    this.scaleMatrix(scale_width, scale_height);

    this.translateMatrix(-origin_x, -origin_y);

    this.drawConsolidatedBitmap(bitmap, undefined, undefined);

    this.restoreMatrix();
  }

  drawTintedBitmap(bitmap, tint, x, y) {

    this.saveMatrix();

    this.translateMatrix(x, y);

    this.drawConsolidatedBitmap(bitmap, undefined, tint);

    this.restoreMatrix();
  }

  drawClippedBitmap(bitmap, start_x, start_y, width, height, x, y) {

    let texture_offset = [

      start_x / bitmap.width,

      start_y / bitmap.height,

      (start_x + width) / bitmap.width,

      (start_y + height) / bitmap.height
    ];

    this.saveMatrix();

    this.translateMatrix(x, y);

    if (bitmap.must_be_flipped) {

      bitmap.must_be_flipped = false;

      this.drawConsolidatedBitmap(bitmap, texture_offset, undefined, true);

      bitmap.must_be_flipped = true;
    }
    else {

      this.drawConsolidatedBitmap(bitmap, texture_offset, undefined, false);
    }

    this.restoreMatrix();
  }

  drawRotatedBitmap(bitmap, center_x, center_y, draw_x, draw_y, theta) {

    this.saveMatrix();

    this.translateMatrix(draw_x, draw_y);

    this.rotateMatrix(theta);

    this.translateMatrix(-center_x, -center_y);

    this.drawConsolidatedBitmap(bitmap, undefined, undefined);

    this.restoreMatrix();
  }

  getIdentityMatrix() {

    return [

      1, 0, 0,

      0, 1, 0,

      0, 0, 1
    ]
  }

  scaleMatrix(scale_x, scale_y) {

    let scaled_matrix = [

      scale_x, 0, 0,

      0, scale_y, 0,

      0, 0, 1
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], scaled_matrix);

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  rotateMatrix(theta) {

    let sine = Math.sin(theta);
    let cosine = Math.cos(theta);

    let rotated_matrix = [

      cosine, sine, 0,

      -sine, cosine, 0,

      0, 0, 1
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], rotated_matrix)

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  translateMatrix(translate_x, translate_y) {

    let translated_matrix = [

      1, 0, 0,

      0, 1, 0,

      translate_x, translate_y, 1
    ];

    let result = this.multiplyMatrices(this.matrix_stack[this.matrix_stack.length - 1], translated_matrix);

    this.matrix_stack[this.matrix_stack.length - 1] = result;
  }

  multiplyMatrices(a, b) {

    let multiplied_matrix = this.getIdentityMatrix();

    multiplied_matrix[0] = a[0] * b[0] + a[3] * b[1];
    multiplied_matrix[3] = a[0] * b[3] + a[3] * b[4];
    multiplied_matrix[6] = a[0] * b[6] + a[3] * b[7] + a[6];

    multiplied_matrix[1] = a[1] * b[0] + a[4] * b[1];
    multiplied_matrix[4] = a[1] * b[3] + a[4] * b[4];
    multiplied_matrix[7] = a[1] * b[6] + a[4] * b[7] + a[7];

    return multiplied_matrix;
  }

  createBitmap(width, height) {

    let framebuffer = this.WebGL2.createFramebuffer();

    let texture = this.WebGL2.createTexture();

    this.WebGL2.bindTexture(this.WebGL2.TEXTURE_2D, texture);

    this.WebGL2.texImage2D(this.WebGL2.TEXTURE_2D, 0, this.WebGL2.RGBA, width, height, 0, this.WebGL2.RGBA, this.WebGL2.UNSIGNED_BYTE, null);

    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_WRAP_S, this.WebGL2.CLAMP_TO_EDGE);
    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_WRAP_T, this.WebGL2.CLAMP_TO_EDGE);

    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_MIN_FILTER, this.WebGL2.NEAREST);
    this.WebGL2.texParameteri(this.WebGL2.TEXTURE_2D, this.WebGL2.TEXTURE_MAG_FILTER, this.WebGL2.NEAREST);

    this.WebGL2.bindFramebuffer(this.WebGL2.FRAMEBUFFER, framebuffer);

    this.WebGL2.framebufferTexture2D(this.WebGL2.FRAMEBUFFER, this.WebGL2.COLOR_ATTACHMENT0, this.WebGL2.TEXTURE_2D, texture, 0);

    // Prevent feed-back loops between framebuffer and active texture.
    this.WebGL2.bindFramebuffer(this.WebGL2.FRAMEBUFFER, null);

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
