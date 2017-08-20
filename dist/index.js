"use strict";

var _config = require("./core/config/config");

var _tFrame = require("./core/widgets/tFrame");

var _blessed = require("blessed");

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

var _chokidar = require("chokidar");

var _chokidar2 = _interopRequireDefault(_chokidar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require("debug")("Terminalus");

/**
 * Init config & screen
 */
const config = (0, _config.getConfig)();
const screen = new _blessed.Screen(_ramda2.default.merge({
    tabSize: 4,
    smartCSR: true,
    fullUnicode: true,
    forceUnicode: true,
    padding: 0,
    autoPadding: true
}, {
    title: config.title
}));

/**
 * Keyboard shortcuts
 */
screen.program.key(["C-c"], () => {
    screen.destroy();
});

/**
 * Crate frame widgets
 */
_ramda2.default.map(frameProps => new _tFrame.TFrame(_ramda2.default.merge(frameProps, {
    parent: screen
})))(config.frames);

// Focus first one
screen.children[0].emit("focus");

/**
 *  Watch patterns from all frames. Screen will emit event on file change
 *  and each frame (with watch defined) will match the file path with it's
 *  pattern ... if it matches then respawn the process
 */
config.watch && _chokidar2.default.watch(config.watch, {
    cwd: process.cwd(),
    ignore: config.ignore,
    ignoreInitial: true
}).on("all", (event, path) => {
    screen.emit("watch", path, event);
});