"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TFrame = TFrame;

var _blessed = require("blessed");

var _child_process = require("child_process");

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _figures = require("figures");

var _figures2 = _interopRequireDefault(_figures);

var _utils = require("../utils");

var U = _interopRequireWildcard(_utils);

var _state = require("../state/state");

var _state2 = _interopRequireDefault(_state);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require("debug")("Terminalus:Frame");

const DEFAULT_FRAME_PROPS = {
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
        focus: {
            scrollbar: {
                bg: "blue"
            },
            border: {
                fg: "blue"
            }
        },
        border: {
            fg: "gray"
        },
        scrollbar: {
            bg: "gray"
        }
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
};function TFrame(props) {

    // No new guard
    if (!(this instanceof TFrame)) {
        return new TFrame(props);
    }

    // Parent constructor
    _blessed.Log.call(this, _ramda2.default.merge(_ramda2.default.clone(DEFAULT_FRAME_PROPS), _ramda2.default.pick(["parent", "label", "top", "left", "width", "height"], props)));

    /*
     * React'ish Props & State
     */
    this.props = Object.freeze(props);
    this.state = (0, _state2.default)({
        process: null,
        processCode: null,
        processSignal: null,
        isFullScreen: false
    }, {
        // everytime something changes, rerender
        afterSet: (prevState, nextState) => {
            this.parent.render(prevState, nextState);
        }
    });

    // Process will update the state on certain events, need the state to be
    // initialezed before running respawn
    this.state.set({
        process: this.respawn()
    });

    /*
     * Kinda like React.render, keep visual related stuff here
     */
    this.on("prerender", () => {

        // debug( {
        // code: this.state.get( "processCode" ),
        // } )

        // size
        // this.state.get( "isFullScreen" ) ? this.toFullscreen() : this.toOriginal()

        //
        const color = this.state.get("processCode") === null ? _chalk2.default.blue : this.state.get("processCode") === 0 ? _chalk2.default.green : _chalk2.default.red;

        // this.state.meta.map( meta => metaSet.get( meta ) )

        this.setLabel(` ${color(_figures2.default.square)} ${this.props.label} `);
    });

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
    this.key(["enter"], () => {
        this.state.set({
            process: this.respawn(this.state.get("process"))
        });
    });

    this.key(["f"], () => {
        this.state.set({
            isFullScreen: !this.state.get("isFullscreen")
        });
    });

    /*
     * Highlight box title
     */
    this.on("focus", () => {
        this.render();
    });

    /*
     * Reset box title to original
     */
    this.on("blur", () => {
        this.render();
    });

    /*
     * Cleanup
     */
    this.on("destroy", () => {
        this.state.get("process").kill();
    });
}

TFrame.prototype = Object.create(_blessed.Log.prototype, {
    type: {
        value: "tFrame",
        enumerable: true,
        configurable: true,
        writable: true
    },

    toFullscreen: {
        value: function toFullscreen() {
            this.left = 0;
            this.top = 0;
        }
    },

    toOriginal: {
        value: function toOriginal() {
            this.left = this.props.left;
            this.top = 0;
        }
    },

    /**
     * Start new child process, kill old one
     *
     * @return {child_process$ChildProcess}  Newly spawned child process
     */
    respawn: {
        value: function respawn(prevProcess) {
            return _ramda2.default.pipe(

            // Kill old
            child => child && child.kill(),

            // Start new
            () => (0, _child_process.spawn)(this.props.cmd, this.props.args, {
                cwd: process.cwd(),
                env: process.env,
                detatched: false,
                encoding: "utf8"
            }),

            // Pipe process to log
            newProcess => {

                //
                this.state.set({
                    processCode: null,
                    processSignal: null
                });

                // Clear content before restart
                this.props.clear && this.setContent("");

                // Configurable stderr printing
                this.props.pipeError && (() => {

                    const printErrorHeader = _ramda2.default.once(() => this.log(U.error(`${_figures2.default.warning} stderr`)));

                    newProcess.stderr.on("data", data => {
                        printErrorHeader();
                        this.log(data.toString());
                    });
                })();

                // Main output
                newProcess.stdout.on("data", data => {
                    this.log(data.toString());
                });

                // Bye Bye
                Array("exit", "close").forEach(event => newProcess.on(event, (code, signal) => {
                    this.state.set({
                        processCode: code,
                        processSignal: signal
                    });
                }));

                return newProcess;
            })(prevProcess);
        }
    }

});