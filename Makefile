.PHONY: lint build clean

build: lint build/tateterm.min.js

# Watch the changes to js source code and update the target js code
watch: index.js $(wildcard src/*.js) $(wildcard lib/*.js)
	./node_modules/.bin/watchify $< --standalone tateterm -o build/tateterm.js

clean:
	rm -rf build/*

lint: index.js $(wildcard src/*.js)
	./node_modules/.bin/jshint $^

build/tateterm.js: index.js $(wildcard src/*.js) $(wildcard lib/*.js)
	./node_modules/.bin/browserify  $< --standalone tateterm -o $@

build/tateterm.min.js: build/tateterm.js
	./node_modules/.bin/uglifyjs --mangle --beautify beautify=false < $< > $@
