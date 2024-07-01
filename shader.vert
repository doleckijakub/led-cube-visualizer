#version 330 core

layout (location = 0) in vec3 in_position;

uniform float aspect_ratio;

out vec2 uv;

void main()
{
	uv = in_position.xy * vec2(aspect_ratio, 1.0); // coordinates with unit height
	gl_Position = vec4(in_position, 1.0);
}
