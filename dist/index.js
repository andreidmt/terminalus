"use strict";

var _config = require("./core/config/config");

var _tFrame = require("./core/widgets/tFrame");

var _blessed = require("blessed");

var _ramda = require("ramda");

var _chokidar = require("chokidar");

const debug = require("debug")("Terminalus");

/**
 * Init config & screen
 */
const config = (0, _config.getConfig)();
const screen = new _blessed.Screen((0, _ramda.merge)({
    tabSize: 4,
    smartCSR: true,
    fullUnicode: true,
    forceUnicode: true,
    padding: 0,
    autoPadding: true
}, {
    title: config.title
}));

screen.program.key(["C-c"], () => {
    screen.destroy();
    process.exit(0);
});

/**
 * Crate frame widgets
 */
(0, _ramda.map)(frameProps => new _tFrame.TFrame((0, _ramda.merge)(frameProps, {
    parent: screen
})))(config.frames);

screen.children[0].emit("focus");

/**
 *  Watch for file changes based on the combined patterns of all frames.
 *
 *  Screen will emit a `watch` event on file change event and each frame (that
 *  defined a `watch` pattern) will listen and respawn the process if it's
 *  pattern matches
 */
config.watch && (0, _chokidar.watch)(config.watch, {
    cwd: process.cwd(),
    ignore: config.ignore,
    ignoreInitial: true
}).on("all", (event, path) => {
    screen.emit("watch", path, event);
});