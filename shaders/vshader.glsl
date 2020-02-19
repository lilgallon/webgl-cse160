// Position
attribute vec4 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ModelMatrix;

// Color
attribute vec4 a_Color;
varying vec4 v_Color;

// Texture
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;

void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_Color = a_Color;
    v_TexCoord = a_TexCoord;
}