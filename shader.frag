#version 330 core

#define EPSILON 0.001

in vec2 uv;

const vec3 light_position = vec3(10, 10, -10);
uniform vec3 camera_position;
uniform vec2 camera_rotation;
uniform samplerCube cubemap;

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
		if (sdf_feet < result.w) result = vec4(kirby_feet_color, sdf_feet);
	}

	{
		vec3 p2 = vec3(-abs(p.x), p.y, p.z);
        vec2 kirby_eye_pos_2 = vec2(0.45, 0.35);
        float sdf_eyes = sdf_ellipsoid(p2 + vec3(0.3,-0.5,-3.85), vec3(0.2, 0.4, 0.22));
        if (-sdf_eyes > result.w) result = vec4(vec3(0, 0, 1) / ((p.y +0.14)) - vec3(1), -sdf_eyes);
	}

	{
		vec3 p2 = vec3(-abs(p.x), p.y, p.z);
        float sdf_eyes = sdf_ellipsoid(p2 + vec3(0.3,-0.65,-4), vec3(0.1, 0.2, 0.11));
        if (sdf_eyes < result.w) result = vec4(vec3(1), sdf_eyes);
	}

	{
		vec3 p2 = vec3(-p.x, p.y, p.z);
        float sdf_mouth = sdf_sphere(p2, kirby_body_center + vec3(0,-0.2,-1.5), 0.3);
        if (-sdf_mouth > result.w) result = vec4(vec3(1, 0, 0), -sdf_mouth);
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

			vec3 rr = reflect(rd, calculate_normal(p));
			vec4 reflected_color = texture(cubemap, rr);
			if (reflected_color.w <= 0) return sdf_result;
			sdf_result.xyz = mix(sdf_result.xyz, reflected_color.xyz, 0.8);

			return sdf_result;
		}
		
		t += d * 0.995;
	}

	return vec4(texture(cubemap, rd).xyz, -1.0);
}

vec3 raymarch_color(vec3 ro, vec3 rd)
{
	vec4 result = raymarch(ro, rd);

	if (result.w <= 0) return result.xyz;

	vec3 p = ro + rd * result.w;
	vec3 normal = calculate_normal(p);
	vec3 light_direction = normalize(light_position - p);
	// vec3 light_color = vec3(1);
	float light = clamp(dot(light_direction, normal), 0.3, 1.0);
	if (raymarch(ro + rd * result.w, light_direction).w > 0) light = 0.3;
	result.xyz *= light;

	return result.xyz;
}

vec3 rotate(vec3 v, vec2 pitch_yaw) {
	mat3 pitch_matrix = mat3(
		1, 0, 0,
		0, cos(pitch_yaw.x), -sin(pitch_yaw.x),
		0, sin(pitch_yaw.x), cos(pitch_yaw.x)
	);

	mat3 yaw_matrix = mat3(
		cos(pitch_yaw.y), 0, sin(pitch_yaw.y),
		0, 1, 0,
		-sin(pitch_yaw.y), 0, cos(pitch_yaw.y)
	);

	return yaw_matrix * (pitch_matrix * v);
}

void main()
{
	vec3 ro = camera_position;
	vec3 rd = rotate(normalize(vec3(uv, 1.0)), camera_rotation);

	vec3 color = raymarch_color(ro, rd);

	frag_color = vec4(color, 1.0);
}
