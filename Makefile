visualizer: main.cpp
	g++ -o $@ -I. $^ -lGL -lGLEW -lglfw
