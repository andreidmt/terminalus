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

var _immutable = require("immutable");

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

    // grabKeys    : true,
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
};function TFrame(props) {

    /*
     * Called without new guard
     */
    if (!(this instanceof TFrame)) {
        return new TFrame(props);
    }

    /*
     * Parent constructor
     */
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
        afterUpdate: (prev, next) => {
            if (!(0, _immutable.is)(prev, next)) {
                this.prepareForRender();
                this.parent.render();
            }
        }
    });

    // Process will update the state on certain events, need the state to be
    // initialezed before running respawn
    this.respawn();

    this.key("tab", () => {
        if (!this.state.get("isFullScreen")) {
            this.setOriginalSize();
            this.parent.focusNext().render();
        }
    });

    this.key("S-tab", () => {
        if (!this.state.get("isFullScreen")) {
            this.setOriginalSize();
            this.parent.focusPrevious().render();
        }
    });

    this.key("escape", () => {
        this.state.get("isFullScreen") && this.state.set({
            isFullScreen: false
        });
    });

    /*
     * Q: Clear frame
     */
    this.key("q", () => {
        this.clearContent();
    });

    /*
     * W:
     */

    /*
     * E:
     */

    /*
     * R:
     */

    /*
     * F: Toggle fullscreen
     */
    this.key("f", () => {
        // this.log( U.info( "Key: F (fullscreen toggle)" ) )
        this.state.set({
            isFullScreen: !this.state.get("isFullScreen")
        });
    });

    /*
     * Enter: restart process
     */
    this.key("enter", () => {
        this.props.clear && this.clearContent();
        this.log(U.info(["Restarting", new Date()].join("\n")));
        this.respawn();
    });

    this.on("click", () => {
        // this.log( U.info( "Event: Click" ) )
    });

    this.on("blur", () => {
        // this.log( U.info( "Event: Blur" ) )
    });

    this.on("destroy", () => {
        this.state.get("process").kill();
    });

    /**
     *
     */
    this.props.watch && this.parent.on("watch", (event, path) => {
        this.log(U.info(`${event}: ${path}`));
    });
}

TFrame.prototype = Object.create(_blessed.Log.prototype, {
    type: {
        value: "tFrame",
        enumerable: true,
        configurable: true,
        writable: true
    },

    /*
     * Kinda like React.render, keep visual related stuff here
     */
    prepareForRender: {
        value: function prepareForRender() {

            // window size
            this.state.get("isFullScreen") ? this.setFullSize() : this.setOriginalSize();

            // label
            const color = this.state.get("processCode") === null ? _chalk2.default.blue : this.state.get("processCode") === 0 ? _chalk2.default.green : _chalk2.default.red;

            this.setLabel(` ${color(_figures2.default.square)} ${this.props.label} `);
        }
    },

    snapToBottom: {
        value: function snapToBottom() {
            this.height = this.parent.height;
            this.setFront();
            this.setScrollPerc(100);
        }
    },

    setFullSize: {
        value: function setFullSize() {
            this.left = 0;
            this.top = 0;
            this.width = this.parent.width;
            this.height = this.parent.height;
            this.setFront();
        }
    },

    setOriginalSize: {
        value: function setOriginalSize() {
            this.left = this.props.left;
            this.top = this.props.top;
            this.width = this.props.width;
            this.height = this.props.height;
        }
    },

    clearContent: {
        value: function clearContent() {
            this.setContent("");
            this.log(U.info("Famous Last Words: CLEAR"));
        }
    },

    /**
     * Start new child process, kill old one
     *
     * @return {child_process$ChildProcess}  Newly spawned child process
     */
    respawn: {
        value: function respawn() {
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

            // Pipe process to screen
            newProcess => {

                this.state.set({
                    processCode: null,
                    processSignal: null
                });

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

                this.state.set({
                    process: newProcess
                });
            })(this.state.get("process"));
        }
    }

});