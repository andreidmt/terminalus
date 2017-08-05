"use strict";

// const debug = require( "debug" )( "Dashboard:Util" )
const chalk = require("chalk");
const boxen = require("boxen");

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

    infoText: chalk.blue,
    errorText: chalk.red,
    successText: chalk.green,

    infoBox: input => chalk.blue.bgBlack(boxen(input, BOXEN_OPT)),
    errorBox: input => chalk.red.bgBlack(boxen(input, BOXEN_OPT)),
    successBox: input => chalk.green.bgBlack(boxen(input, BOXEN_OPT))
};