// @flow

// const _debug = require( "debug" )( "Terminalus" )

const { getConfig } = require( "./config/config" )
const { getLayout } = require( "./widgets/layout" )
const M = require( "./m" )

import type { ConfigType } from "./config/config"

M.pipe(
    ( config: ConfigType ) => getLayout( {
        title : config.name,
        frames: config.frames,
    } ),
    appLayout => {

        [ appLayout.focused ] = appLayout.children

        // appLayout.focusOffset( 1 )
        appLayout.render()
    }
)( getConfig() )
