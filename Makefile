.PHONY: lint build clean

build: lint build/terminal.min.js

# Watch the changes to js source code and update the target js code
watch-js: terminal.js $(wildcard src/*.js) $(wildcard lib/*.js)
	./node_modules/.bin/watchify $< --standalone Terminal -o build/terminal.js

clean:
	rm -rf build/*

lint: terminal.js $(wildcard src/*.js)
	./node_modules/.bin/jshint $^

build/terminal.js: terminal.js $(wildcard src/*.js) $(wildcard lib/*.js)
	./node_modules/.bin/browserify $< --standalone Terminal -o $@

build/terminal.min.js: build/terminal.js
	./node_modules/.bin/uglifyjs --mangle --beautify beautify=false < $< > $@
