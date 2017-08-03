// @flow

// const _debug = require( "debug" )( "Dashboard:CMDCommand" )
const { Log, Text } = require( "blessed" )

const M = require( "../m" )
const { start, pipe, COLORS } = require( "../utils" )

const DEFAULT_COMMAND_OPTIONS = {
    _type       : "terminalusLog",
    scrollable  : true,
    input       : true,
    alwaysScroll: true,
    scrollbar   : {
        ch     : " ",
        inverse: true,
    },
    keys       : true,
    mouse      : true,
    autoPadding: 0,
    padding    : {
        top   : 0,
        bottom: 0,
        left  : 1,
        right : 1,
    },
    border: {
        type: "line",
    },
    style: {
        selected: {
            fg: COLORS.GRAY,
            bg: COLORS.BLUE,
        },
        focus: {
            scrollbar: {
                bg: COLORS.BLUE,
            },
            border: {
                fg: COLORS.BLUE,
            },
        },
        border: {
            fg: COLORS.GRAY,
        },
        scrollbar: {
            bg: COLORS.GRAY,
        },
    },
}

const DEFAULT_FOOTER_OPTIONS = {
    detatched: true,
    height   : 1,
    padding  : {
        left  : 1,
        right : 1,
        top   : 0,
        bottom: 0,
    },
    border: 0,
}

// =================================
//             Flow types          =
// =================================

import type { ChildProcessType } from "../utils"

export type CommandOptionsType = {
    label: string;
    top: string;
    left: string;
    width: string;
    height: string;
    parent?: Object;

    clearOnRestart?: boolean;
    cmd: string;
    args?: string[];
    stderr?: boolean;
}

type CommandType = {
    start: (
        current: ?ChildProcessType,
        cmd: string,
        args: string[]
    ) => ChildProcessType;
}

// ======= End of Flow types =======

/**
 * Factory function for creating new Command Log widget objects
 *
 * @param  {CommandOptionsType}  options  asd
 *
 * @return {CommandType}         New Command Log object
 */
const CMDLogFactory = ( options: CommandOptionsType ): CommandType => {

    const _cmd = options.cmd
    const _args = options.args || []
    const _stderr = options.stderr || true
    const _clearOnRestart = options.clearOnRestart

    let childProcess = start( null, _cmd, _args )

    const logWidget = new Log( Object.assign(
        M.clone( DEFAULT_COMMAND_OPTIONS ),
        M.pick( [
            "parent",
            "label",
            "top",
            "left",
            "width",
            "height",
        ], options )
    ) )

    logWidget._.footer = new Text( Object.assign( {}, {
        parent: logWidget.parent,
        top   : logWidget.atop + logWidget.height - 1,
        left  : `${options.left}+3`,
    }, DEFAULT_FOOTER_OPTIONS ) )

    /*
     * Pass the process output to the log element
     */
    pipe( childProcess, logWidget, _stderr )

    /*
     * Restart process on enter key press
     */
    logWidget.key( [ "enter" ], () => {
        _clearOnRestart || logWidget.setContent( "" )
        childProcess = start( null, _cmd, _args )
        pipe( childProcess, logWidget, _stderr )
    } )

    /*
     * Highlight box title
     */
    logWidget.on( "focus", () => {
        logWidget.setLabel( `[ ${ options.label } ]` )
        logWidget.parent.render()
    } )

    /*
     * Reset box title to original
     */
    logWidget.on( "blur", () => {
        logWidget.setLabel( options.label )
        logWidget.parent.render()
    } )

    /*
     * Enhancing to Log widget with command specific logic
     */
    logWidget.command = {
        restart: () => {
            childProcess = start( childProcess, _cmd, _args )
        },
    }

    return logWidget
}

module.exports = {
    getCMDLog: CMDLogFactory,
}
