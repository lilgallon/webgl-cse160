/**
 * File created by Lilian Gallon, 01/13/2020.
 * https://nero.dev
 * CSE160 / CSE160L
 *
 *
 * Here is how this file is designed:
 *
 * 1. Global vars:
 *      It contains all the global variables. We need to use
 *      global variables when we *really* need to.
 *
 * 2. Utility functions
 *      Here goes all the functions that we will use multiple
 *      times. These functions should not change for every case
 *      use. In fact, they are meant to work for any use.
 *
 * 3. Initialization
 *      Here goes the functions:
 *      -   init()
 *      -   postInit()
 *      They are self-documented.
 *
 * 4. Code
 *      Here goes the code to draw stuff.
 *
 *
 * Project architecture:
 *
 * - libs/ : Contains all the external libraries (cuon-utils, webgl-utils|debug)
 * - shaders/ : Contains the shaders' source code
 * - index.html : HTML code
 * - graphics.js : this
 */

// Global vars //

var VSHADER_SOURCE = null; // contains the vertex shader source code
var FSHADER_SOURCE = null; // contains the fragment shader source code
var CANVAS_ID = 'webgl'; // The canvas's id

// Controls
var C_CLEAR_BUTTON = 'clear';
var C_DRAWING_MODE = 0;
var C_RED = 0.5;
var C_GREEN = 0.0;
var C_BLUE = 1.0;
var C_SIZE = 40.0;
var C_SEGS = 10;

// Utility functions //

/**
 * Function inspired from "WebGL Programming Guide: Interactive 3D Graphics
 * Programming with WebGL", 1st ed. written by Kouichi Matsudi and Rodger Lea
 * and published by WOW!.
 *
 * It loads a shader's source code. It must be called two times with the
 * vertex shader source code and the fragment shader source code.
 *
 * @param {WebGL2RenderingContext} gl WebGL context
 * @param {String} path shader path (../../../filename.extension)
 * @param {Shader} shader kind of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 */
function loadShaderFile(gl, path, shader) {
    // ES7 async code
    (async() => {
        try {
            let response = await fetch(path);
            let code = await response.text();
            onLoadShader(gl, code, shader);
        } catch (e) {
            console.log(e);
        }
    })();
}

/**
 * Function inspired from "WebGL Programming Guide: Interactive 3D Graphics
 * Programming with WebGL", 1st ed. written by Kouichi Matsudi and Rodger Lea
 * and published by WOW!.
 *
 * It puts the shader's source code in the right variable. Then, if both of the
 * shaders' codes are loaded, it calls postInit().
 *
 * ERRORS:
 * - If the shader type is unknown, a message will be sent to the console displaying
 *      the wrong shader.
 * - If one of the shader's code is null, the code may stop here. In this case, there
 *      should be an other error message coming from an other function.
 *
 * @param {WebGL2RenderingContext} gl WebGL context
 * @param {String} code the shader's code
 * @param {Shader} type kind of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 */
function onLoadShader(gl, code, shader) {
    switch (shader) {
        case gl.VERTEX_SHADER:
            VSHADER_SOURCE = code;
            break;
        case gl.FRAGMENT_SHADER:
            FSHADER_SOURCE = code;
            break;
        default:
            console.log("Unknown shader type");
            console.log(shader);
            break;
    }

    if(shadersLoaded()) {
        postInit(gl);
    }
}

/**
 * Returns true if the shaders' source codes were loaded.
 * Sources:
 * - VSHADER_SOURCE,
 * - FSHADER_SOURCE
 */
function shadersLoaded() {
    return VSHADER_SOURCE !== null && FSHADER_SOURCE !== null;
}

/**
 * It returns the canvas.
 *
 * ERROR:
 * It does not return anything if the canvas could not be found.
 */
function getCanvas() {
    let canvas = document.getElementById(CANVAS_ID);
    if (!canvas) {
        console.log('Could not find canvas with id "' + CANVAS_ID + '"');
        return;
    }

    return canvas;
}

/**
 * From coordinates on the canvas, it returns the coordinates on the
 * WebGL world.
 * @param {Float} x x canvas coordinate
 * @param {Float} y y canvas coordinate
 * @param {Array} r bounding rect of cursor
 *
 * @returns A 2D array containing [x, y], the coordinates in the WebGL world
 */
function canvasToWebglCoords(x, y, r) {
    let c = getCanvas();

    return [
        ((x - r.left) - c.height/2) / (c.height/2),
        (c.width/2 - (y - r.top)) / (c.width/2)
    ];
}

/**
 * It clears the screen to black.
 * @param {WebGL2RenderingContext} gl WebGL context
 */
function clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// Init //

/**
 * Called when the HTML document is ready.
 *
 * It will call postInit once done.
 */
function init() {
    let gl = getWebGLContext(getCanvas());
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    loadShaderFile(gl, 'shaders/fshader.glsl', gl.FRAGMENT_SHADER);
    loadShaderFile(gl, 'shaders/vshader.glsl', gl.VERTEX_SHADER);

    // It will automatically call postInit once that the shaders' files are loaded
    // -> Because file loading is asynchronous
}

/**
 * Called when:
 * - The canvas is ready
 * - The WebGL context is ready
 * - The shaders' source code is loaded
 *
 * It should call start() once everything is initialized
 *
 * @param {WebGL2RenderingContext} gl WebGL Context
 */
function postInit(gl) {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders:');
        console.log("Vertex shader code:", VSHADER_SOURCE);
        console.log("Fragment shader code:", FSHADER_SOURCE);
        return;
    }

    start(gl);
}

// Code //

/**
 * Called once everything has been initialized.
 *
 * @param {WebGL2RenderingContext} gl WebGL Context
 */
function start(gl) {

    clear(gl);

    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

    let shapes = [];

    document.getElementById(C_CLEAR_BUTTON).onclick = e => {
        clear(gl);
        shapes = [];
    }

    getCanvas().onmousedown = e => {
        let coords = canvasToWebglCoords(e.clientX, e.clientY, e.target.getBoundingClientRect());

        // Building the shape
        let shape = [
            coords,                     // Shape's coordinates
            C_SIZE,                     // Shape's size
            [C_RED, C_GREEN, C_BLUE]    // Shape's color
        ];

        // Clearing
        clear(gl);

        shapes.push(shape);

        // Drawing
        for (shape of shapes) {
            // Position
            gl.vertexAttrib3f(a_Position, shape[0][0], shape[0][1], 0.0);
            // Size
            gl.vertexAttrib1f(a_PointSize, shape[1]);
            // Color
            gl.uniform4f(u_FragColor, shape[2][0], shape[2][1], shape[2][2], 1.0);
            // Draw
            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }
}