"use strict";

var _config = require("./core/config/config");

var _tFrame = require("./core/widgets/tFrame");

var _blessed = require("blessed");

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require("debug")("Terminalus");

/**
 * Init config & screen
 */
const tConfig = (0, _config.getConfig)();
const tScreen = new _blessed.Screen(_ramda2.default.merge({
    tabSize: 4,
    smartCSR: true,
    fullUnicode: true,
    forceUnicode: true,
    padding: 0,
    autoPadding: true
}, {
    title: tConfig.title
}));

/**
 * Keyboard shortcuts
 */
tScreen.program.key(["C-c"], () => {
    tScreen.destroy();
});

tScreen.program.key("tab", () => {
    tScreen.focusNext().render();
});

tScreen.program.key("S-tab", () => {
    tScreen.focusPrevious().render();
});

tScreen.program.key("escape", () => {
    tScreen.focused.emit("blur");
    tScreen.render();
});

/**
 * Add frames
 */
Object.values(tConfig.frames).forEach(frameProps => new _tFrame.TFrame(_ramda2.default.merge(frameProps, {
    parent: tScreen
})));

tScreen.focused = tScreen.children[0];
tScreen.render();