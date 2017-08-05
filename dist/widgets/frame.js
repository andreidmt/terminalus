"use strict";

const debug = require("debug")("Terminalus:Frame");
const { Log, Text } = require("blessed");
const { spawn } = require("child_process");
const chalk = require("chalk");

const M = require("../m");
const { infoBox, errorBox, COLORS } = require("../utils");

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
 * Pipe node child process output to blessed log element
 *
 * @param   {ChildProcessType}  childProcess  node child process
 * @param   {FrameType}   frame        blessed log element
 *
 * @return  {void}
 */
const pipe = (childProcess, frame, stderr) => {

    childProcess.stdout.on("data", data => {
        frame.log(data.toString());
    });

    stderr && childProcess.stderr.on("data", data => {
        frame.log(data.toString());
    });

    childProcess.on("exit", (code, signal) => {
        frame.updateStatus({
            code,
            signal
        });
    });
};

/**
 * Start new child process, kill old one
 *
 * @param  {ChildProcessType}  current  Node child process
 * @param  {string}        cmd      Process command string
 * @param  {string[]}      args     Process arguments string
 *
 * @return {ChildProcessType}  Newly spawned child process
 */
const start = (current, cmd, args) => M.pipe(M.if(M.isSomething, item => item.kill()), () => spawn(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    detatched: false,
    encoding: "utf8"
}))(current);

/**
 * Factory function for creating new Command Log widget objects
 *
 * @param  {FramePROPSType}  PROPS  asd
 *
 * @return {FrameType}         New Command Log object
 */
const FrameFactory = props => {

    let childProcess = start(null, props.cmd, props.args);

    const log = new Log(Object.assign({}, M.clone(DEFAULT_FRAME_PROPS), M.pick(["parent", "label", "top", "left", "width", "height"], props)));

    const footer = new Text(Object.assign({}, {
        parent: log.parent,
        top: log.atop + log.height - 1,
        left: `${props.left}+3`
    }, DEFAULT_FOOTER_PROPS));

    /*
     * Pass the process output to the log element
     */
    pipe(childProcess, log, props.stderr);

    /*
     * Restart process on enter key press
     */
    log.key(["enter"], () => {

        //
        props.clearOnRestart && log.setContent("");

        childProcess = start(null, props.cmd, props.args);
        pipe(childProcess, log, props.stderr);
    });

    /*
     * Highlight box title
     */
    log.on("focus", () => {
        log.setLabel(` ${props.label} `);
        log.parent.render();
    });

    /*
     * Reset box title to original
     */
    log.on("blur", () => {
        log.setLabel(props.label);
        log.parent.render();
    });

    /*
     * Most of the processes would of ended, need this for running processes
     */
    log.on("destroy", () => {
        childProcess.kill();
    });

    /*
     * Enhancing to Log widget with command specific logic
     */
    log.restart = () => {
        childProcess = start(childProcess, props.cmd, props.args);
    };

    log.updateStatus = newStatus => {
        const logByType = newStatus.code === 0 ? chalk.green : chalk.red;

        footer.setContent(logByType([`PID: ${childProcess.pid}`, `stderr: ${props.stderr.toString()}`, `code: ${newStatus.code}`, newStatus.signal ? `signal: ${newStatus.signal}` : ""].filter(string => string.length !== 0).join(" | ")));

        log.render();
    };

    return log;
};

module.exports = {
    getFrame: FrameFactory
};