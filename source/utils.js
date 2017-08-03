// const _debug = require( "debug" )( "Dashboard:Util" )
const _chalk = require( "chalk" )
const _boxen = require( "boxen" )

const COLORS = {
    GRAY : "#f9f9f9",
    PINK : "#da7b7b",
    BLUE : "#7ba2f1",
    RED  : "#dc322f",
    GREEN: "#c3e88d",
}

const BOXEN_OPT = {
    padding: {
        top   : 0,
        bottom: 0,
        left  : 2,
        right : 2,
    },
}

const infoText = _chalk.hex( COLORS.BLUE )
const errorText = _chalk.red
const successText = _chalk.green

module.exports = {
    COLORS,
    infoText ,
    errorText ,
    successText,
    infoBox   : input => infoText.bgBlack( _boxen( input , BOXEN_OPT ) ),
    errorBox  : input => errorText.bgBlack( _boxen( input, BOXEN_OPT ) ),
    successBox: input => successText.bgBlack( _boxen( input , BOXEN_OPT ) ),
}
