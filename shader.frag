#version 330 core

#define EPSILON 0.1
#define BACKGROUND vec3(0.1)

in vec2 uv;

// uniform vec3 camera_position;
vec3 camera_position = vec3(0);

out vec4 frag_color;

vec3 rgb3(int r, int g, int b)
{
	return vec3(r, g, b) / 255.0;
}

float sdf_sphere(vec3 p, vec3 c, float r)
{
	return length(p - c) - r;
}

vec3 kirby_body_center = vec3(0, 0, 5);
float kirby_body_radius = 1.4;
vec3 kirby_body_color = rgb3(255, 170, 210);

vec4 kirby(vec3 p)
{
	vec4 result = vec4(1.0 / 0.0);
	
	{
		float sdf_body = sdf_sphere(p, kirby_body_center, kirby_body_radius);
		if (sdf_body < result.w) result = vec4(kirby_body_color, sdf_body);
	}

	return result;
}

vec4 raymarch(vec3 ro, vec3 rd)
{
	float t = 0.0;
	for (int i = 0; i < 200 && t < 100.0; i++)
	{
		vec3 p = ro + rd * t;
		vec4 sdf_result = kirby(p);
		float d = sdf_result.w;

		if (d < EPSILON)
		{
			sdf_result.w = t;
			return sdf_result;
		}
		else
		{
			t += d; // perhaps not full d??
		}
	}

	return vec4(-1.0);
}

vec3 raymarch_color(vec3 ro, vec3 rd)
{
	vec4 result = raymarch(ro, rd);

	if (result.w <= 0) return BACKGROUND;

	return result.xyz;
}

void main()
{
	vec3 ro = camera_position;
	vec3 target = vec3(uv, 1.0);
	vec3 rd = normalize(target - ro);

	vec3 color = raymarch_color(ro, rd);

	frag_color = vec4(color, 1.0);
}
