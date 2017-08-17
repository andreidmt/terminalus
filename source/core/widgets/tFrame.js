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
 * @class   Frame
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
        // everytime something changes, rerender
        afterSet: ( prevState, nextState ) => {
            this.parent.render( prevState, nextState )
        },
    } )

    // Process will update the state on certain events, need the state to be
    // initialezed before running respawn
    this.state.set( {
        process: this.respawn(),
    } )

    /*
     * Kinda like React.render, keep visual related stuff here
     */
    this.on( "prerender", () => {

        // debug( {
        // code: this.state.get( "processCode" ),
        // } )

        // size
        // this.state.get( "isFullScreen" ) ? this.toFullscreen() : this.toOriginal()

        //
        const color = this.state.get( "processCode" ) === null ? chalk.blue :
            this.state.get( "processCode" ) === 0 ? chalk.green : chalk.red

        // this.state.meta.map( meta => metaSet.get( meta ) )

        this.setLabel( ` ${ color( unicode.square ) } ${ this.props.label } ` )
    } )

    /**
     * Link meta listeners to frame events
     */
    // this.props.meta.map( M.pipe(
    //     ( metaName: string ) =>
    //         require( `../meta/${metaName}` ),
    //     metaObj =>
    //         Object.entries( metaObj.subscribe ).forEach(
    //             ( [ eventName: string, listener: Function ] ) => {
    //                 this.on( eventName, listener )
    //             } )
    // ) )

    /*
     * Respawn process on enter key press
     */
    this.key( [ "enter" ], () => {
        this.state.set( {
            process: this.respawn( this.state.get( "process" ) ),
        } )
    } )

    this.key( [ "f" ], () => {
        this.state.set( {
            isFullScreen: !this.state.get( "isFullscreen" ),
        } )
    } )

    /*
     * Highlight box title
     */
    this.on( "focus", () => {
        this.render()
    } )

    /*
     * Reset box title to original
     */
    this.on( "blur", () => {
        this.render()
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

    toFullscreen: {
        value: function toFullscreen() {
            this.left = 0
            this.top = 0
        },
    },

    toOriginal: {
        value: function toOriginal() {
            this.left = this.props.left
            this.top = 0
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
