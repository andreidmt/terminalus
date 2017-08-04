"use strict";

// const _debug = require( "debug" )( "Terminalus:Frame" )
const { Log, Text } = require("blessed");

const M = require("../m");
const { start, pipe, COLORS } = require("../utils");

const DEFAULT_FRAME_PROPS = {
    _type: "terminalusFrame",
    scrollable: true,
    input: true,
    alwaysScroll: true,
    scrollbar: {
        ch: " ",
        inverse: true
    },
    keys: true,
    mouse: true,
    autoPadding: 0,
    padding: {
        top: 0,
        bottom: 0,
        left: 1,
        right: 1
    },
    border: {
        type: "line"
    },
    style: {
        selected: {
            fg: COLORS.GRAY,
            bg: COLORS.BLUE
        },
        focus: {
            scrollbar: {
                bg: "blue"
            },
            border: {
                fg: "blue"
            }
        },
        border: {
            fg: COLORS.GRAY
        },
        scrollbar: {
            bg: COLORS.GRAY
        }
    }
};

const DEFAULT_FOOTER_PROPS = {
    detatched: true,
    height: 1,
    padding: {
        left: 1,
        right: 1,
        top: 0,
        bottom: 0
    },
    border: 0

    // =================================
    //             Flow types          =
    // =================================

};

// ======= End of Flow types =======

/**
 * Factory function for creating new Command Log widget objects
 *
 * @param  {FramePROPSType}  PROPS  asd
 *
 * @return {FrameType}         New Command Log object
 */
const FrameFactory = props => {

    const _cmd = props.cmd;
    const _args = props.args || [];
    const _stderr = props.stderr || true;
    const _clearOnRestart = props.clearOnRestart;

    let childProcess = start(null, _cmd, _args);

    const logWidget = new Log(Object.assign({}, M.clone(DEFAULT_FRAME_PROPS), M.pick(["parent", "label", "top", "left", "width", "height"], props)));

    logWidget._.footer = new Text(Object.assign({}, {
        parent: logWidget.parent,
        top: logWidget.atop + logWidget.height - 1,
        left: `${props.left}+3`
    }, DEFAULT_FOOTER_PROPS));

    /*
     * Pass the process output to the log element
     */
    pipe(childProcess, logWidget, _stderr);

    /*
     * Restart process on enter key press
     */
    logWidget.key(["enter"], () => {
        _clearOnRestart || logWidget.setContent("");
        childProcess = start(null, _cmd, _args);
        pipe(childProcess, logWidget, _stderr);
    });

    /*
     * Highlight box title
     */
    logWidget.on("focus", () => {
        logWidget.setLabel(`[ ${props.label} ]`);
        logWidget.parent.render();
    });

    /*
     * Reset box title to original
     */
    logWidget.on("blur", () => {
        logWidget.setLabel(props.label);
        logWidget.parent.render();
    });

    /*
     * Enhancing to Log widget with command specific logic
     */
    logWidget.command = {
        restart: () => {
            childProcess = start(childProcess, _cmd, _args);
        }
    };

    return logWidget;
};

module.exports = {
    getFrame: FrameFactory
};