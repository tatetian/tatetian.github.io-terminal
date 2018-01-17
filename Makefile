.PHONY: watch clean

build: lint build/tateterm.min.js

# Watch the changes to js source code and update the target js code
watch: index.js $(wildcard src/*.js) $(wildcard lib/*.js)
	./node_modules/.bin/watchify $< --standalone tateterm -o build/tateterm.js

init:
	git submodule init
	git submodule update
	cd lib/xterm.js/ && npm install
	mkdir build

clean:
	rm -rf build/*

lint: index.js $(wildcard src/*.js)
	./node_modules/.bin/jshint $^

xterm: lib/xterm.js/src/xterm.js lib/xterm.js/addons/fit/fit.js
	cd lib/xterm.js/ && npm build

build/tateterm.js: index.js $(wildcard src/*.js) xterm 
	./node_modules/.bin/browserify  $< --standalone tateterm -o $@

build/tateterm.min.js: build/tateterm.js
	./node_modules/.bin/uglifyjs --mangle --beautify beautify=false < $< > $@
