"use strict";

// const debug = require( "debug" )( "Terminalus:Layout" )
const { Screen, Layout } = require("blessed");
const M = require("../m");
const { getFrame } = require("./frame");

const DEFAULT_LAYOUT_PROPS = {
    tabSize: 4,
    smartCSR: true,
    fullUnicode: true,
    forceUnicode: true,
    padding: 0,
    autoPadding: true
};

// ======= End of Flow types =======

/**
 * Factory function for creating new Command Layout widget objects
 *
 * @param  {LayoutPropsType}  options  asd
 *
 * @return {CMDLogType}         New Command Layout object
 */
const TermScreen = options => {

    const screen = new Screen(Object.assign({}, M.clone(DEFAULT_LAYOUT_PROPS), {
        title: options.title
    }));

    screen.program.key(["C-c"], () => {
        screen.destroy();
    });

    screen.program.key("tab", () => {
        screen.focusNext().render();
    });

    screen.program.key("S-tab", () => {
        screen.focusPrevious().render();
    });

    Object.values(options.frames).forEach(frameProps => {
        getFrame(Object.assign({}, {
            parent: screen
        }, frameProps));
    });

    return screen;
};

module.exports = {
    getTermScreen: TermScreen
};