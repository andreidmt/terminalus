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

var _minimatch = require("minimatch");

var _utils = require("../utils");

var U = _interopRequireWildcard(_utils);

var _state = require("../state/state");

var _state2 = _interopRequireDefault(_state);

var _tMenu = require("./tMenu");

var _tMenu2 = _interopRequireDefault(_tMenu);

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
    border: "line",
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
     * @param {Object}    props  Frame properties
     * @param {string}    props.label       Frame title
     * @param {string}    props.cmd         Process command
     * @param {string[]}  props.args        Command arguments
     * @param {string}    props.watch       Glob file patterns
     * @param {string[]}  props.meta        List of meta info handlers
     * @param {boolean}   props.clear       Clear frame content on process restart
     * @param {boolean}   props.showErrors  If should print process error stream
     *
     * @return  {Object}  Visual element extended from Blessed Log
     *
     * @example const eslintFrame = new Frame({ cmd: "npm", args: [ "run", "eslint"
     *          ] })
     */
};function TFrame(props) {

    /*
     * Guard against calls without new
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
    this.renderCount = 0;
    this.props = Object.freeze(props);
    this.state = (0, _state2.default)({
        process: null,
        childCode: null,
        childSignal: null,
        data: new _immutable.List(),
        showErrors: this.props.showErrors,
        showLogs: false,
        isFullScreen: false,
        isMenuVisible: false,
        watchPattern: this.props.watch ? new _minimatch.Minimatch(this.props.watch) : null
    }, {
        afterUpdate: (prev, next) => {
            if (!(0, _immutable.is)(prev, next)) {
                this.renderCount++;
                this.prepareForRender();
                this.parent.render();
            }
        }
    });

    /**
     * Options menu
     */
    this.menu = new _tMenu2.default({
        items: [{
            label: "Clear content         Q",
            key: "q",
            handler: this.onKeyQ.bind(this)
        }, {
            label: "Toggle errors         E",
            key: "e",
            handler: this.onKeyE.bind(this)
        }, {
            label: "Toggle log            R",
            key: "r",
            handler: this.onKeyR.bind(this)
        }, {
            label: "Toggle fullscreen     F",
            key: "f",
            handler: this.onKeyF.bind(this)
        }, {
            label: "Respawn process       \u21B5",
            key: "s",
            handler: this.onKeyEnter.bind(this)
        }],
        onSelect: () => {
            this.state.set({
                isMenuVisible: false
            });
        },
        onKey: {
            "w": this.onKeyW.bind(this),
            "escape": this.onKeyW.bind(this),
            "tab": this.onKeyTab.bind(this),
            "S-tab": this.onKeyShiftTab.bind(this)
        },
        parent: this.props.parent,
        frame: this,
        top: `${this.props.top}+1`,
        left: `${this.props.left}+1`
    });

    // Process will update the state on certain events, need the state to be
    // initialezed before running respawn
    this.respawn();

    this.key("escape", this.onKeyEsc);
    this.key("enter", this.onKeyEnter);
    this.key("tab", this.onKeyTab);
    this.key("S-tab", this.onKeyShiftTab);
    this.key("q", this.onKeyQ);
    this.key("w", this.onKeyW);
    this.key("e", this.onKeyE);
    this.key("r", this.onKeyR);
    this.key("f", this.onKeyF);

    this.on("destroy", () => {
        this.state.get("process").kill();
    });

    /**
     * If some file changed and it matches our pattern, respawn process
     */
    this.props.watch && this.parent.on("watch", path => {
        this.state.get("watchPattern").match(path) && this.respawn();
    });
}

TFrame.prototype = Object.create(_blessed.Log.prototype, {
    type: {
        value: "tFrame",
        enumerable: true,
        configurable: true,
        writable: false
    },

    /**
     * Clear content
     */
    onKeyQ: {
        value: function onKeyQ() {
            this.clearAll();
        }
    },

    /**
     * Toggle options menu
     */
    onKeyW: {
        value: function onKeyW() {
            this.state.set({
                isMenuVisible: !this.state.get("isMenuVisible")
            });
        }
    },

    /**
     * Toggle error showing
     */
    onKeyE: {
        value: function onKeyE() {
            this.state.set({
                showErrors: !this.state.get("showErrors")
            });
        }
    },

    /**
     * Toggle logs showing
     */
    onKeyR: {
        value: function onKeyR() {
            this.state.set({
                showLogs: !this.state.get("showLogs")
            });
        }
    },

    /**
     * Toggle fullscreen
     */
    onKeyF: {
        value: function onKeyF() {
            this.log(U.info("Key: F (fullscreen toggle)"));
            this.state.set({
                isFullScreen: !this.state.get("isFullScreen"),
                isMenuVisible: false
            });
        }
    },

    /**
     * Exit from fullscreen and close menu
     */
    onKeyEsc: {
        value: function onKeyEsc() {
            this.state.set({
                isFullScreen: false,
                isMenuVisible: false
            });
        }
    },

    /**
     * Restart process
     */
    onKeyEnter: {
        value: function onKeyEnter() {
            this.respawn();
        }
    },

    /**
     * Focus next
     */
    onKeyTab: {
        value: function onKeyTab() {
            if (!this.state.get("isFullScreen")) {
                this.state.set({
                    isMenuVisible: false
                });
                this.parent.focusNext();
            }
        }
    },

    /**
     * Focus previous
     */
    onKeyShiftTab: {
        value: function onKeyShiftTab() {
            if (!this.state.get("isFullScreen")) {
                this.state.set({
                    isMenuVisible: false
                });
                this.parent.focusPrevious();
            }
        }
    },

    /*
     * Kinda like React.render, keep visual related stuff here
     */
    prepareForRender: {
        value: function prepareForRender() {

            const shouldAdd = _ramda2.default.anyPass([
            // is data
            _ramda2.default.propEq("type", "stdout"),

            // is error and should print error
            _ramda2.default.both(_ramda2.default.propEq("type", "stderr"), () => _ramda2.default.equals(true, this.state.get("showErrors"))),

            // is log and should print log
            _ramda2.default.both(_ramda2.default.propEq("type", "log"), () => _ramda2.default.equals(true, this.state.get("showLogs")))]);

            const concatData = _ramda2.default.reduce((acc, entry) => shouldAdd(entry) ? acc.concat(entry.type === "log" ? U.info(entry.content) : entry.content) : acc, "");

            if (this.state.hasChanged("data", "showErrors", "showLogs")) {
                this.setContent(concatData(this.state.get("data")));

                // this.setScrollPerc( 100 )
            }

            // window size
            if (this.state.get("isFullScreen")) {
                this.left = 0;
                this.top = 0;
                this.width = this.parent.width;
                this.height = this.parent.height;

                this.setFront();
            } else {
                this.left = this.props.left;
                this.top = this.props.top;
                this.width = this.props.width;
                this.height = this.props.height;
            }

            // options menu
            if (this.state.get("isMenuVisible")) {
                this.menu.setFront();
                this.menu.show();
                this.menu.focus();
            } else {
                this.menu.hide();
            }

            // label
            const color = this.state.get("childCode") === null ? _chalk2.default.blue : this.state.get("childCode") === 0 ? _chalk2.default.green : _chalk2.default.red;

            const showErrorsMeta = `${this.state.get("showErrors") ? _figures2.default.tick : _figures2.default.cross} stderr`;

            const showLogsMeta = `${this.state.get("showLogs") ? _figures2.default.tick : _figures2.default.cross} logs`;

            this.setLabel(` ${color(_figures2.default.square)} ${this.props.label}  - ${showErrorsMeta} | ${showLogsMeta} (${this.renderCount})`);
        }
    },

    clearAll: {
        value: function clearAll() {
            this.state.set({
                data: []
            });

            this.pushLog("Famous Last Words: CLEAR");
        }
    },

    pushData: {
        value: function pushData(data, type = "stdout") {
            this.state.set({
                data: this.state.get("data").push({
                    type,
                    content: data
                })
            });
        }
    },

    pushError: {
        value: function pushError(data) {
            this.pushData(data.concat("\n"), "stderr");
        }
    },

    pushLog: {
        value: function pushLog(data) {
            this.pushData(data.concat("\n"), "log");
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

            // Kill old & start new
            child => {

                if (child) {
                    child.kill();
                    this.pushLog(["Restarting", new Date()]);
                }

                this.state.set({
                    childCode: null,
                    childSignal: null,
                    childStartAt: process.hrtime()
                });

                return (0, _child_process.spawn)(this.props.cmd, this.props.args, {
                    cwd: process.cwd(),
                    env: process.env,
                    detatched: false,
                    encoding: "utf8"
                });
            },

            // Pipe process to screen
            child => {

                // Main output
                child.stdout.on("data", data => {
                    this.pushData(data.toString());
                });

                const printErrorHeader = _ramda2.default.once(() => this.pushLog(`${_figures2.default.warning} stderr`));

                // Error output
                child.stderr.on("data", data => {
                    printErrorHeader();
                    this.pushError(data.toString());
                });

                // Bye Bye
                Array("exit", "close").forEach(event => child.on(event, (code, signal) => {
                    this.state.set({
                        childCode: code,
                        childSignal: signal,
                        childEndAt: process.hrtime(this.state.get("childStartAt"))
                    });

                    this.pushLog(`I died, ${event}: code ${code}, signal ${signal}`);
                }));

                this.state.set({
                    process: child
                });
            })(this.state.get("process"));
        }
    }

});