"use strict";

// const _debug = require( "debug" )( "Terminalus" )

const { getConfig } = require("./config/config");
const { getLayout } = require("./widgets/layout");
const M = require("./m");

M.pipe(config => getLayout({
    title: config.name,
    frames: config.frames
}), appLayout => {
    appLayout.focusOffset(0);
    appLayout.render();
})(getConfig());