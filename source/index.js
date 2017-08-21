const debug = require( "debug" )( "Terminalus" )

import { getConfig } from "./core/config/config"
import { TFrame } from "./core/widgets/tFrame"
import { Screen } from "blessed"
import R from "ramda"
import chokidar from "chokidar"

/**
 * Init config & screen
 */
const config = getConfig()
const screen = new Screen( R.merge( {
    tabSize     : 4,
    smartCSR    : true,
    fullUnicode : true,
    forceUnicode: true,
    padding     : 0,
    autoPadding : true,
}, {
    title: config.title,
} ) )

/**
 * Keyboard shortcuts
 */
screen.program.key( [ "C-c" ], () => {
    screen.destroy()
    process.exit( 0 )
} )

/**
 * Crate frame widgets
 */
R.map( frameProps =>
    new TFrame(
        R.merge( frameProps, {
            parent: screen,
        } )
    )
)( config.frames )

// Focus first one
screen.children[ 0 ].emit( "focus" )

/**
 *  Watch patterns from all frames. Screen will emit event on file change
 *  and each frame (with watch defined) will match the file path with it's
 *  pattern ... if it matches then respawn the process
 */
config.watch && chokidar.watch( config.watch, {
    cwd          : process.cwd(),
    ignore       : config.ignore,
    ignoreInitial: true,
} ).on( "all", ( event, path ) => {
    screen.emit( "watch", path, event )
} )
