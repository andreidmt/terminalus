// @flow

// const _debug = require( "debug" )( "Dashboard" )

const { getConfig } = require( "./config" )
const { getCMDLayout } = require( "./widgets/layout" )

const M = require( "./m" )

M.pipe(
    config => getCMDLayout( {
        title   : config.name,
        commands: config.commands,
    } ),
    appLayout => {
        appLayout.focusOffset( 0 )
        appLayout.render()
    }
)( getConfig() )
