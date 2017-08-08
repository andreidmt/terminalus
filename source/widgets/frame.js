// @flow

const debug = require( "debug" )( "Terminalus:Frame" )
const { Log } = require( "blessed" )
const { spawn } = require( "child_process" )
const chalk = require( "chalk" )

const M = require( "../m" )
const { COLORS } = require( "../utils" )

const DEFAULT_FRAME_PROPS = {
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
                bg: "blue",
            },
            border: {
                fg: "blue",
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

// =================================
//             Flow types          =
// =================================

export type ChildProcessType = child_process$ChildProcess

export type FramePropsType = {
    label: string;
    top: string;
    left: string;
    width: string;
    height: string;
    parent?: Object;

    clearOnRestart: boolean;
    cmd: string;
    args: string[];
    stderr: boolean;
}

export type FrameType = {
    status: {
        running: boolean;
        code: number;
        signal: string;
    };
    footer: Blessed$Text;
    childProcess: ChildProcessType;

    respawn: () => void;
} & Blessed$Log

// ======= End of Flow types =======

/**
 * Pipe node child process output to blessed log element
 *
 * @param   {ChildProcessType}  childProcess  node child process
 * @param   {FrameType}   frame        blessed log element
 *
 * @return  {void}
 */
const pipe = (
    childProcess: ChildProcessType,
    frame: FrameType,
    stderr: boolean
) => {

    childProcess.stdout.on( "data", ( data: Buffer ) => {
        frame.log( data.toString() )
    } )

    stderr && childProcess.stderr.on( "data", ( data: Buffer ) => {
        frame.log( data.toString() )
    } )

    childProcess.on( "close", ( code, signal ) => {
        if ( frame.childProcess.pid === childProcess.pid ) {
            frame.status = {
                running: false,
                code,
                signal,
            }
        }
    } )

    childProcess.on( "exit", ( code: number, signal: string ) => {

        // This happens when process was delayed and exit got here after the
        // new process was spawned
        if ( frame.childProcess.pid === childProcess.pid ) {
            frame.status = {
                running: false,
                code,
                signal,
            }
        }
    } )
}

/**
 * Frame element with a command piping it's output to the screen
 *
 * @class   Frame
 * @param   {FramePropsType}  props  The properties
 * @return  {FrameType}
 * @example
 * const logWithCommand = new Frame({
 *      cmd: "npm",
 *      args: [ "run", "eslint" ]
 * })
 */
function Frame( props: FramePropsType ): FrameType {

    /*
     * Parent constructor
     */
    Log.call( this, Object.assign( {},
        M.clone( DEFAULT_FRAME_PROPS ),
        M.pick( [
            "parent",
            "label",
            "top",
            "left",
            "width",
            "height",
        ], props )
    ) )

    // incoming props
    this.props = props

    //
    this.childProcess = this.respawn()

    // child process status
    // this.status = {
    //     running: true,
    //     code   : null,
    //     signal : null,
    // }

    /*
     * Respawn process on enter key press
     */
    this.key( [ "enter" ], () => {
        this.childProcess = this.respawn()
    } )

    /*
     * Highlight box title
     */
    this.on( "focus", () => {
        this.updateLabel()
    } )

    /*
     * Reset box title to original
     */
    this.on( "blur", () => {
        this.updateLabel()
    } )

    /*
     * Most of the processes would of ended, need this for running processes
     */
    this.on( "destroy", () => {
        this.childProcess.kill()
    } )
}

Frame.prototype = Object.create( Log.prototype, {
    type: {
        value       : "terminalusFrame",
        enumerable  : true,
        configurable: true,
        writable    : true,
    },

    /**
     * Start new child process, kill old one
     *
     * @return {ChildProcessType}  Newly spawned child process
     */
    respawn: {
        value: function respawn(): ChildProcessType {
            return M.pipe(
                M.if(
                    M.isSomething,
                    ( child: ChildProcessType ) => child.kill()
                ),
                () => spawn( this.props.cmd, this.props.args, {
                    cwd      : process.cwd(),
                    env      : process.env,
                    detatched: false,
                    encoding : "utf8",
                } )
            )( this.childProcess )
        },
    },

    /**
     * { item_description }
     */
    updateLabel: {
        value: function updateLabel() {
            const color = this.status.running ? chalk.blue :
                this.status.code === 0 ? chalk.green : chalk.red

            const meta = this.focused
                ? `[ █ ${ this.childProcess.pid } ]`
                : "█"

            this.setLabel( ` ${ color( meta ) } ${ this.props.label } ` )
            this.parent.render()
        },
    },

    /**
     * { item_description }
     */
    childProcess: {
        get() {
            return this._.childProcess
        },
        set( value ) {
            this._.childProcess = value

            this.status = {
                running: true,
                code   : null,
                signal : null,
            }

            this.props.clearOnRestart && this.setContent( "" )

            pipe( this.childProcess, this, this.props.stderr )
        },
    },

    /**
     * { item_description }
     */
    status: {
        get() {
            return this._.status
        },
        set( value ) {
            this._.status = value
            this.updateLabel()
        },
        enumerable: true,
    },
} )

module.exports = {
    Frame,
    getFrame: ( props: FramePropsType ): FrameType => new Frame( props ),
}
