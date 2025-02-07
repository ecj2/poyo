"use strict";

let WebGL2;

let buffer;
let custom_program;
let locations = {};

let bitmap;
let buffer_bitmap;

async function loadResources() {

  // Use linear texture filtering to reduce jagged edges.
  Poyo.setNewBitmapFlags(Poyo.MIN_LINEAR, Poyo.MAG_LINEAR);

  bitmap = await Poyo.loadBitmap("data/png/bee.png");

  if (!bitmap) {

    Poyo.displayError("failed to load bee.png");
  }

  buffer_bitmap = Poyo.createBitmap(Poyo.getCanvasWidth(), Poyo.getCanvasHeight());

  WebGL2 = Poyo.getContext();

  createCustomShader();
}

function createCustomShader() {

  let vertex_shader_source = `

    #version 300 es

    layout(location = 0) in vec2 a_vertex_position;
    layout(location = 1) in vec2 a_texture_position;

    out vec2 v_texture_position;

    void main(void) {

      gl_Position = vec4(a_vertex_position, 1.0, 1.0);

      v_texture_position = a_texture_position;
    }
  `;

  let fragment_shader_source = `

    #version 300 es

    precision mediump float;

    in vec2 v_texture_position;

    uniform float u_time;

    uniform sampler2D u_texture;

    out vec4 final_color;

    void main(void) {

      vec2 position = v_texture_position;

      const float PI = 3.1415926535897932384626433832795;

      // Adjust the texture position to achieve a "wobble" effect.
      position.s += cos(position.t * 10.0 * PI + u_time * 10.0) / 100.0;
      position.t += sin(position.s * 10.0 * PI + u_time * 10.0) / 100.0;

      final_color = texture(u_texture, position);
    }
  `;

  let vertex_shader = Poyo.createShader(vertex_shader_source, WebGL2.VERTEX_SHADER);
  let fragment_shader = Poyo.createShader(fragment_shader_source, WebGL2.FRAGMENT_SHADER);

  if (!vertex_shader || !fragment_shader) {

    Poyo.displayError(Poyo.getLastError());
  }

  custom_program = Poyo.createProgram(vertex_shader, fragment_shader);

  if (!custom_program) {

    Poyo.displayError("failed to create custom shader program");
  }

  WebGL2.useProgram(custom_program);

  locations.u_time = WebGL2.getUniformLocation(custom_program, "u_time");
  locations.u_texture = WebGL2.getUniformLocation(custom_program, "u_texture");

  if (locations.u_time == null || locations.u_texture == null) {

    Poyo.displayError("failed to get uniform locations");
  }

  buffer = WebGL2.createBuffer();

  let buffer_data = new Float32Array(

    [

      // Vertex data.
      -1.0, -1.0,
      1.0, -1.0,
      1.0, 1.0,
      -1.0, 1.0,

      // Texture data.
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]
  );

  WebGL2.bindBuffer(WebGL2.ARRAY_BUFFER, buffer);
  WebGL2.bufferData(WebGL2.ARRAY_BUFFER, buffer_data, WebGL2.STATIC_DRAW);

  // Clear cache and tell Poyo to use its default program.
  // Without this, future Poyo drawing calls would throw errors.
  Poyo.clearCache();
}

function render() {

  // Clear to black.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0));

  let b_w = Poyo.getBitmapWidth(bitmap);
  let b_h = Poyo.getBitmapHeight(bitmap);

  let c_w = Poyo.getCanvasWidth();
  let c_h = Poyo.getCanvasHeight();

  // Set future drawing calls to take place on buffer_bitmap.
  Poyo.setDrawTarget(buffer_bitmap);

  // Clear buffer_bitmap's color buffer.
  Poyo.clearToColor(Poyo.createColor(0, 0, 0, 0));

  // Draw the bitmap in the center of the draw target.
  Poyo.drawBitmap(bitmap, (c_w - b_w) / 2, (c_h - b_h) / 2);

  // Return future drawing to occur on the canvas.
  Poyo.setDrawTarget(Poyo.getDefaultDrawTarget());

  // Draw a wobbly version buffer_bitmap using a bespoke shader program.
  drawWobblyBitmap(buffer_bitmap);
}

function drawWobblyBitmap(bitmap) {

  WebGL2.useProgram(custom_program);

  WebGL2.bindBuffer(WebGL2.ARRAY_BUFFER, buffer);

  WebGL2.vertexAttribPointer(0, 2, WebGL2.FLOAT, false, 0, 0);
  WebGL2.enableVertexAttribArray(0);

  WebGL2.vertexAttribPointer(1, 2, WebGL2.FLOAT, false, 0, 32);
  WebGL2.enableVertexAttribArray(1);

  WebGL2.activeTexture(WebGL2.TEXTURE0);
  WebGL2.bindTexture(WebGL2.TEXTURE_2D, bitmap.texture);
  WebGL2.uniform1i(locations.u_texture, 0);

  WebGL2.uniform1f(locations.u_time, Poyo.getTime());

  WebGL2.drawArrays(WebGL2.TRIANGLE_FAN, 0, 4);

  Poyo.clearCache();
}
