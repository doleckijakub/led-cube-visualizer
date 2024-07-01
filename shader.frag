#version 330 core

in vec3 ray_direction;

out vec4 frag_color;

void main()
{
	frag_color = vec4(ray_direction, 1.0);
}
