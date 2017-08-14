"use strict";

// const _debug = require( "debug" )( "Terminalus" )

const { getConfig } = require("./config/config");
const { getTermScreen } = require("./widgets/layout");
const M = require("./m");

M.pipe(config => getTermScreen({
    title: config.name,
    frames: config.frames
}), termScreen => {
    termScreen.focused = termScreen.children[0];
    termScreen.render();
})(getConfig());