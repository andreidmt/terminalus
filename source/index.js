// const _debug = require( "debug" )( "Dashboard" )

const _blessed = require( "blessed" )
const { getConfig } = require( "./config" )
const { getCMDLog } = require( "./widgets/command" )
const M = require( "./m" )

M.pipe(
    config => _blessed.screen( {
        title       : config.name,
        tabSize     : 4,
        smartCSR    : true,
        fullUnicode : true,
        forceUnicode: true,
        padding     : 0,
        autoPadding : true,
    } ),
    appScreen => {

        appScreen.program.key( [ "q", "esc", "C-c" ], () => {
            appScreen.destroy()
        } )

        appScreen.program.key( "tab", () => {
            appScreen.focusNext()
            appScreen.render()
        } )
        appScreen.program.key( "S-tab", () => {
            appScreen.focusPrevious()
            appScreen.render()
        } )

        getConfig().commands.forEach( command => {

            getCMDLog( Object.assign( {
                parent: appScreen,
            }, command ) )

        } )

        appScreen.render()
        appScreen.focusOffset( 0 )
    }
)( getConfig() )
