"use strict";

// const _debug = require( "debug" )( "Dashboard:Util" )
const _chalk = require("chalk");
const _boxen = require("boxen");
const { spawn } = require("child_process");
const M = require("./m");

const BOXEN_OPT = {
    padding: {
        top: 0,
        bottom: 0,
        left: 2,
        right: 2
    }
};

module.exports = {
    COLORS: {
        GRAY: "#f9f9f9",
        PINK: "#da7b7b",
        BLUE: "#7ba2f1",
        RED: "#dc322f",
        GREEN: "#c3e88d"
    },

    infoText: _chalk.blue,
    errorText: _chalk.red,
    successText: _chalk.green,

    infoBox: input => _chalk.blue.bgBlack(_boxen(input, BOXEN_OPT)),
    errorBox: input => _chalk.red.bgBlack(_boxen(input, BOXEN_OPT)),
    successBox: input => _chalk.green.bgBlack(_boxen(input, BOXEN_OPT)),

    /**
     * Start new child process, kill old one
     *
     * @param  {ChildProcessType}  current  Node child process
     * @param  {string}        cmd      Process command string
     * @param  {string[]}      args     Process arguments string
     *
     * @return {ChildProcessType}  Newly spawned child process
     */
    start: (current, cmd, args = []) => M.pipe(M.if(M.isSomething, item => item.kill()), () => spawn(cmd, args, {
        cwd: process.cwd(),
        env: process.env,
        detatched: false,
        encoding: "utf8"
    }))(current),

    /**
     * Pipe node child process output to blessed log element
     *
     * @param   {ChildProcessType}  childProcess  node child process
     * @param   {Blessed$Log}   logBox        blessed log element
     *
     * @return  {void}
     */
    pipe: (childProcess, logBox, stderr) => {

        //
        childProcess.stdout.on("data", data => {
            logBox.log(data.toString());
        });

        //
        stderr || childProcess.stderr.on("data", data => {
            logBox.log(data.toString());
        });

        //
        childProcess.on("exit", (code, signal) => {
            const logByType = code === 0 ? _chalk.green : _chalk.red;

            logBox._.footer.setContent(logByType([`PID: ${childProcess.pid}`, `stderr: ${stderr.toString()}`, `code: ${code}`, signal ? `signal: ${signal}` : ""].filter(string => string.length !== 0).join(" | ")));
            logBox._.footer.parent.render();
        });
    }
};