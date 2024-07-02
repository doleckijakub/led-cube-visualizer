#version 330 core

#define EPSILON 0.001
#define BACKGROUND vec3(0.1)

in vec2 uv;

const vec3 light_position = vec3(10, 10, -10);
uniform vec3 camera_position;

out vec4 frag_color;

vec3 rgb3(int r, int g, int b)
{
	return vec3(r, g, b) / 255.0;
}

float sdf_sphere(vec3 p, vec3 c, float r)
{
	return length(p - c) - r;
}

float sdf_ellipsoid(vec3 p, vec3 r)
{
	float k0 = length(p / r);
	float k1 = length(p / (r * r));
	return k0 * (k0 - 1.0) / k1;
}

vec3  kirby_body_center = vec3(0, 0, 5);
float kirby_body_radius = 1.4;
vec3  kirby_body_color = rgb3(255, 170, 210);
vec3  kirby_blush_relative_position = vec3(0.45, 0.06, -0.8);
float kirby_blush_radius = 0.55;
vec3  kirby_blush_color = rgb3(228, 78, 145);
vec3  kirby_feet_color = rgb3(213, 0, 66);

vec4 kirby(vec3 p)
{
	vec4 result = vec4(1.0 / 0.0);
	
	{
		float sdf_body = sdf_sphere(p, kirby_body_center, kirby_body_radius);
		if (sdf_body < result.w)
		{
			vec3 color = kirby_body_color;
			vec3 blush_center = kirby_body_center + kirby_blush_relative_position;
			vec3 p2 = vec3(abs(p.x), 2 * p.y, p.z);
			if (sdf_sphere(p2, blush_center, kirby_blush_radius) < 0) color = kirby_blush_color;
			result = vec4(color, sdf_body);
		}
	}

	{
		vec3 p2 = vec3(abs(p.x), p.yz) + vec3(-0.7, 1.3, -5);
		float sdf_feet = sdf_ellipsoid(p2, vec3(0.7, 0.5, 0.5));
		if (sdf_feet < result.w)
		{
			result = vec4(kirby_feet_color, sdf_feet);
		}
	}

	return result;
}

vec3 calculate_normal(vec3 p)
{
	vec2 e = vec2(1.0,-1.0) * 0.5773 * 0.001;
    return normalize(e.xyy * kirby(p + e.xyy).w + 
					 e.yyx * kirby(p + e.yyx).w + 
					 e.yxy * kirby(p + e.yxy).w + 
					 e.xxx * kirby(p + e.xxx).w);
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

			vec3 normal = calculate_normal(p);
			vec3 light_direction = normalize(light_position - p);
			// vec3 light_color = vec3(1);
			float light = clamp(dot(light_direction, normal), 0.3, 1.0);
			sdf_result.xyz *= light;

			return sdf_result;
		}
		
		t += d;
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
	vec3 rd = normalize(vec3(uv, 1.0));

	vec3 color = raymarch_color(ro, rd);

	frag_color = vec4(color, 1.0);
}
