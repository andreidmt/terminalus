const _debug = require( "debug" )( "Dashboard" )

const _blessed = require( "blessed" )
const _notifier = require( "node-notifier" )

// const R = require( "ramda" )
const { spawn, exec } = require( "child_process" )
const { DEFAULT_BOX_OPTIONS } = require( "./constants" )
const { infoBox,successBox, errorBox } = require( "./utils" )
const M = require( "./m" )

const CommandBox = require( "./widgets/commandLog" )

/**
 * { lambda_description }
 *
 * @param      {Function}  cmdProc  The command proc
 * @return     {String}    { description_of_the_return_value }
 */
const _cmdStatus = cmdProc =>
    cmdProc.pid ? cmdProc.pid : "ended"

/**
 * { function_description }
 *
 * @param      {Object}  cmdProc  The command proc
 * @param      {Object}    logBox   The log box
 * @return     {void}    { description_of_the_return_value }
 */
const _bindCMDtoLog = ( cmdProc, logBox ) => {

    _debug( logBox.footer )

    cmdProc.stdout.on( "data", data => {
        logBox.log( data.toString() )
    } )

    if ( logBox.cmd.stderr ) {
        cmdProc.stderr.on( "data", data => {
            logBox.log( data.toString() )
        } )
    }
    cmdProc.stdout.on( "message", data => {
        logBox.log( data.toString() )
    } )
    cmdProc.on( "exit", ( code, signal ) => {

        const logByType = code === 0 ? successBox : errorBox

        logBox.log(
            logByType( `Ended with code: ${code}, signal: ${signal}` ) )

    } )
}

/**
 * Gets the log.
 *
 * @param      {Object}  command  The command
 * @return     {Object}  The log.
 */
const getCMDBox = command => {

    const processParams = [
        command.cmd, command.args || [], {
            cwd      : process.cwd(),
            env      : process.env,
            detatched: false,
            encoding : "utf8",
        },
    ]

    let cmdProcess = spawn( ...processParams )

    // _debug( M.clone( DEFAULT_BOX_OPTIONS ) )

    const logBox = _blessed.log( Object.assign(
        M.clone( DEFAULT_BOX_OPTIONS ),
        command.position,
        {
            label: command.title,
        },
    ) )

    /**
     * Box events
     */
    logBox.on( "focus",() => {
        logBox.setLabel(
            `## ${ logBox.options.label }: ${_cmdStatus( cmdProcess )}` )
        logBox.parent.render()
    } )

    logBox.on( "blur", () => {
        logBox.setLabel(
            `${ logBox.options.label }: ${_cmdStatus( cmdProcess )}` )
        logBox.parent.render()
    } )

    logBox.on( "destroy",() => {
        cmdProcess.kill()
    } )

    /*
     * On enter respawn new process
     */
    logBox.key( [ "enter" ], () => {
        logBox.log( infoBox( `Killing previous process: PID ${cmdProcess.pid}` ) )
        cmdProcess.kill()

        cmdProcess = spawn( ...processParams )
        logBox.log( infoBox( `Started new one: PID ${cmdProcess.pid}` ) )
        logBox.setLabel( `## ${ logBox.options.label }: ${cmdProcess.pid}` )

        _bindCMDtoLog( cmdProcess, logBox )
    } )

    /**
     * pipe cmd stdout to logBox
     */
    _bindCMDtoLog( cmdProcess, logBox )

    return logBox
}

module.exports = {
    getCMDBox,
}
