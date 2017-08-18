const debug = require( "debug" )( "Terminalus:Frame" )

import { Log } from "blessed"
import { spawn } from "child_process"
import R from "ramda"
import chalk from "chalk"
import unicode from "figures"

import * as U from "../utils"
import stateWithHistory from "../state/state"

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
        focus: {
            scrollbar: {
                bg: "blue",
            },
            border: {
                fg: "blue",
            },
        },
        border: {
            fg: "gray",
        },
        scrollbar: {
            bg: "gray",
        },
    },
}

/**
 * Log element with a background command piping it's output
 *
 * @class   TFrame
 *
 * @param   {Object}    props            Frame properties
 * @param   {string}    props.label      Frame title
 * @param   {string}    props.cmd        Process command
 * @param   {string[]}  props.args       Command arguments
 * @param   {string}    props.watch      Glob file patterns
 * @param   {string[]}  props.meta       List of meta info handlers
 * @param   {boolean}   props.clear      Clear frame content on process restart
 * @param   {boolean}   props.pipeError  If should print process error stream
 *
 * @return  {Object}    Visual element extended from Blessed Log
 *
 * @example const eslintFrame = new Frame({ cmd: "npm", args: [ "run", "eslint"
 *          ] })
 */
export function TFrame( props ) {

    // No new guard
    if ( !( this instanceof TFrame ) ) {
        return new TFrame( props )
    }

    // Parent constructor
    Log.call( this, R.merge(
        R.clone( DEFAULT_FRAME_PROPS ),
        R.pick( [
            "parent", "label",
            "top", "left", "width", "height",
        ], props ),
    ) )

    /*
     * React'ish Props & State
     */
    this.props = Object.freeze( props )
    this.state = stateWithHistory( {
        process      : null,
        processCode  : null,
        processSignal: null,
        isFullScreen : false,
    }, {
        // on set/delete rerender
        afterUpdate: () => {
            this.prepareForRender()
            this.parent.render()
        },
    } )

    // Process will update the state on certain events, need the state to be
    // initialezed before running respawn
    this.state.set( {
        process: this.respawn(),
    } )

    /*
     * Respawn process on enter key press
     */
    this.key( [ "enter" ], () => {
        this.state.set( {
            process: this.respawn( this.state.get( "process" ) ),
        } )
    } )

    /*
     * Make window fullscreen
     */
    this.key( [ "f" ], () => {
        this.state.set( {
            isFullScreen: !this.state.get( "isFullScreen" ),
        } )
    } )

    /*
     * Only tab if not in fullscreen
     */
    this.key( "tab", () => {
        if ( !this.state.get( "isFullScreen" ) ) {
            this.parent.focusNext().render()
        }
    } )

    this.key( "S-tab", () => {
        if ( !this.state.get( "isFullScreen" ) ) {
            this.parent.focusPrevious().render()
        }
    } )

    this.key( "escape", () => {
        if ( this.state.get( "isFullScreen" ) ) {
            this.state.set( {
                isFullScreen: false,
            } )
        } else {
            this.emit( "blur" )
        }
    } )

    /*
     * Cleanup
     */
    this.on( "destroy", () => {
        this.state.get( "process" ).kill()
    } )
}

TFrame.prototype = Object.create( Log.prototype, {
    type: {
        value       : "tFrame",
        enumerable  : true,
        configurable: true,
        writable    : true,
    },

    /*
     * Kinda like React.render, keep visual related stuff here
     */
    prepareForRender: {
        value: function prepareForRender() {
            // window size
            this.state.get( "isFullScreen" ) ? this.setFullSize() :
                this.setLayoutSize()

            // label
            const color =
                this.state.get( "processCode" ) === null ? chalk.blue :
                    this.state.get( "processCode" ) === 0 ? chalk.green :
                        chalk.red

            this.setLabel( ` ${ color( unicode.square ) } ${ this.props.label } ` )
        },
    },

    setFullSize: {
        value: function setFullSize() {
            this.left = 0
            this.top = 0
            this.width = this.parent.width
            this.height = this.parent.height
            this.setFront()
            this.setScrollPerc( 100 )
        },
    },

    setLayoutSize: {
        value: function setLayoutSize() {
            this.left = this.props.left
            this.top = this.props.top
            this.width = this.props.width
            this.height = this.props.height
            this.setScrollPerc( 100 )
        },
    },

    /**
     * Start new child process, kill old one
     *
     * @return {child_process$ChildProcess}  Newly spawned child process
     */
    respawn: {
        value: function respawn( prevProcess ) {
            return R.pipe(

                // Kill old
                child => child && child.kill(),

                // Start new
                () => spawn( this.props.cmd, this.props.args, {
                    cwd      : process.cwd(),
                    env      : process.env,
                    detatched: false,
                    encoding : "utf8",
                } ),

                // Pipe process to log
                newProcess => {

                    //
                    this.state.set( {
                        processCode  : null,
                        processSignal: null,
                    } )

                    // Clear content before restart
                    this.props.clear && this.setContent( "" )

                    // Configurable stderr printing
                    this.props.pipeError && ( () => {

                        const printErrorHeader = R.once( () =>
                            this.log( U.error( `${unicode.warning } stderr` ) )
                        )

                        newProcess.stderr.on( "data", data => {
                            printErrorHeader()
                            this.log( data.toString() )
                        } )
                    } )()

                    // Main output
                    newProcess.stdout.on( "data", data => {
                        this.log( data.toString() )
                    } )

                    // Bye Bye
                    Array( "exit", "close" ).forEach(
                        event => newProcess.on( event,
                            ( code, signal ) => {
                                this.state.set( {
                                    processCode  : code,
                                    processSignal: signal,
                                } )
                            } )
                    )

                    return newProcess
                }
            )( prevProcess )
        },
    },

} )
