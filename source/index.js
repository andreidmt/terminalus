// @flow

// const _debug = require( "debug" )( "Terminalus" )

const { getConfig } = require( "./config/config" )
const { getTermScreen } = require( "./widgets/layout" )
const M = require( "./m" )

import type { ConfigType } from "./config/config"
import type { TermScreenType } from "./widgets/layout"

M.pipe(
    ( config: ConfigType ) => getTermScreen( {
        title : config.name,
        frames: config.frames,
    } ),
    ( termScreen: TermScreenType ) => {
        termScreen.focused = termScreen.children[ 0 ]
        termScreen.render()
    }
)( getConfig() )
