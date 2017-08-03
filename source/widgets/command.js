// @flow

// const _debug = require( "debug" )( "Dashboard:CMDLog" )
const { Log, Text } = require( "blessed" )
const { spawn } = require( "child_process" )

// const Rx = require( "@reactivex/rxjs" )

const M = require( "../m" )
const { successText, errorText, COLORS } = require( "../utils" )

const DEFAULT_BOX_OPTIONS = {
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


type NProcessType = child_process$ChildProcess

type CMDLogOptionsType = {
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

type CMDLogType = {
    start: (
        current: ?NProcessType,
        cmd: string,
        args: string[]
    ) => NProcessType;
}

/**
 * Start new child process, kill old one
 *
 * @param  {NProcessType}  current  Node child process
 * @param  {string}        cmd      Process command string
 * @param  {string[]}      args     Process arguments string
 *
 * @return {NProcessType}  Newly spawned child process
 */
const start = ( current: ?NProcessType, cmd: string, args: string[] = [] ): NProcessType =>
    M.pipe(
        M.if(
            M.isSomething,
            ( item: NProcessType ) => item.kill()
        ),
        () => spawn( cmd, args, {
            cwd      : process.cwd(),
            env      : process.env,
            detatched: false,
            encoding : "utf8",
        } )
    )( current )

/**
 * { function_description }
 *
 * @param   {NProcessType}  childProcess  The child process n process type
 * @param   {Blessed$Log}   logBox        The log box blessed log
 * @param   {<type>}        options       The options
 *
 * @return  {Log}     { description_of_the_return_value }
 */
const pipe = (
    childProcess: NProcessType,
    logBox: Blessed$Log,
    stderr: boolean
) => {

    //
    childProcess.stdout.on( "data", ( data: Buffer ) => {
        logBox.log( data.toString() )
    } )

    //
    stderr || childProcess.stderr.on( "data", ( data: Buffer ) => {
        logBox.log( data.toString() )
    } )

    //
    childProcess.on( "exit", ( code: number, signal: string ) => {
        const logByType = code === 0 ? successText : errorText

        logBox._.footer.setContent(
            logByType( [
                `PID: ${childProcess.pid}`,
                `stderr: ${stderr.toString()}`,
                `code: ${code}`,
                signal ? `signal: ${signal}` : "",
            ].filter( string => string.length !== 0 ).join( " | " ) )
        )
        logBox._.footer.parent.render()
    } )
}


/**
 * Factory function for creating new Command Log widget objects
 *
 * @param  {CMDLogOptionsType}  options  asd
 *
 * @return {CMDLogType}         New Command Log object
 */
const CMDLogFactory = ( options: CMDLogOptionsType ): CMDLogType => {

    const _cmd = options.cmd
    const _args = options.args || []
    const _stderr = options.stderr || true
    const _clearOnRestart = options.clearOnRestart

    let childProcess = start( null, _cmd, _args )

    const logWidget = new Log( Object.assign(
        M.clone( DEFAULT_BOX_OPTIONS ),
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
