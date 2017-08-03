"use strict";

// const _debug = require( "debug" )( "Dashboard" )
// const M = require( "./m" )
// const commandLog = require( "./widgets/commandLog" )

const _blessed = require("blessed");

const { getConfig } = require("./config");
const { getCMDLog } = require("./widgets/command");

const appScreen = _blessed.screen({
    title: "Halt and catch fire",
    tabSize: 4,
    smartCSR: true,
    fullUnicode: true,
    forceUnicode: true,
    padding: 0,
    autoPadding: true
});

appScreen.program.key(["q", "esc", "C-c"], () => {
    appScreen.destroy();
});

appScreen.program.key("tab", () => {
    appScreen.focusNext();
    appScreen.render();
});

getConfig().commands.forEach(command => {

    getCMDLog(Object.assign({
        parent: appScreen
    }, command));
});

appScreen.render();
appScreen.focusOffset(0);