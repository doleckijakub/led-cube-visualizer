#version 330 core

layout (location = 0) in vec3 in_position;

out vec3 ray_direction;

void main()
{
	ray_direction = normalize(vec3(in_position.xy, 1.0));
	gl_Position = vec4(in_position, 1.0);
}
