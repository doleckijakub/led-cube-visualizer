#include <stdio.h>
#define eprintf(format, ...) fprintf(stderr, format, ##__VA_ARGS__)

#include <errno.h>
#include <string.h>
#include <stdlib.h>
char *read_file(const char *filename) {
	FILE *fp;
	char *result;
	long length;

	fp = fopen(filename, "r");
	if (!fp) goto error;

	fseek(fp, 0, SEEK_END);
	result = (char *) malloc((length = ftell(fp)) + 1);
	result[length] = 0;
	fseek(fp, 0, SEEK_SET);

	fread(result, sizeof(char), length, fp);

	return result;

error:

	eprintf("%s() failed: Failed to read file %s: %s\n", __func__, filename, strerror(errno));

	if (fp) fclose(fp);
	if (result) free(result);

	return NULL;
}

#include <GL/glew.h>
#include <GLFW/glfw3.h>
GLuint create_shader_program(const char* vertex_src, const char* fragment_src) {
	GLuint vertex_shader = glCreateShader(GL_VERTEX_SHADER);
	glShaderSource(vertex_shader, 1, &vertex_src, NULL);
	glCompileShader(vertex_shader);
	
	GLint success;
	GLchar infoLog[512];
	glGetShaderiv(vertex_shader, GL_COMPILE_STATUS, &success);
	if (!success) {
		glGetShaderInfoLog(vertex_shader, 512, NULL, infoLog);
		eprintf("Error: Vertex shader compilation failed: %s\n", infoLog);
	}

	GLuint fragment_shader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragment_shader, 1, &fragment_src, NULL);
	glCompileShader(fragment_shader);
	glGetShaderiv(fragment_shader, GL_COMPILE_STATUS, &success);
	if (!success) {
		glGetShaderInfoLog(fragment_shader, 512, NULL, infoLog);
		eprintf("Error: Fragment shader compilation failed: %s\n", infoLog);
	}

	GLuint shader_program = glCreateProgram();
	glAttachShader(shader_program, vertex_shader);
	glAttachShader(shader_program, fragment_shader);
	glLinkProgram(shader_program);
	glGetProgramiv(shader_program, GL_LINK_STATUS, &success);
	if (!success) {
		glGetProgramInfoLog(shader_program, 512, NULL, infoLog);
		eprintf("Error: Shader linking failed: %s\n", infoLog);
	}

	glDeleteShader(vertex_shader);
	glDeleteShader(fragment_shader);

	return shader_program;
}

int main() {
	if (!glfwInit()) {
		eprintf("Failed to initialize GLFW\n");
		return 1;
	}

	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);

	GLFWwindow* window = glfwCreateWindow(800, 600, "LED Cube", NULL, NULL);
	if (!window) {
		eprintf("Failed to create a window\n");
		glfwTerminate();
		return 1;
	}

	glfwMakeContextCurrent(window);

	if (glewInit() != GLEW_OK) {
		eprintf("Failed to initialize GLEW\n");
		return 1;
	}

	GLfloat vertices[] = {
		-1.f, -1.f, 0.f,
		+1.f, -1.f, 0.f,
		+1.f, +1.f, 0.f,
		-1.f, +1.f, 0.f,
	};

	GLuint indices[] = {
		0, 1, 2,
		2, 3, 0,
	};

	GLuint VBO, VAO, EBO;
	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glGenBuffers(1, &EBO);
	glBindVertexArray(VAO);
	glBindBuffer(GL_ARRAY_BUFFER, VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(GLfloat), (GLvoid*)0);
	glEnableVertexAttribArray(0);
	glBindVertexArray(0);

	GLuint shaderProgram = create_shader_program(read_file("shader.vert"), read_file("shader.frag"));

	while (!glfwWindowShouldClose(window)) {
		glfwPollEvents();

		glClear(GL_COLOR_BUFFER_BIT);

		glUseProgram(shaderProgram);
		glBindVertexArray(VAO);
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
		glBindVertexArray(0);

		glfwSwapBuffers(window);
	}

	glDeleteVertexArrays(1, &VAO);
	glDeleteBuffers(1, &VBO);
	glDeleteBuffers(1, &EBO);

	glfwTerminate();

	return 0;

}
