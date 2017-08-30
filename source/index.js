const debug = require( "debug" )( "Terminalus" )

import { getConfig } from "./core/config/config"
import { TFrame } from "./core/widgets/tFrame"
import { Screen } from "blessed"
import { map, merge } from "ramda"
import { watch } from "chokidar"

/**
 * Init config & screen
 */
const config = getConfig()
const screen = new Screen( merge( {
    tabSize     : 4,
    smartCSR    : true,
    fullUnicode : true,
    forceUnicode: true,
    padding     : 0,
    autoPadding : true,
}, {
    title: config.title,
} ) )

screen.program.key( [ "C-c" ], () => {
    screen.destroy()
    process.exit( 0 )
} )

/**
 * Crate frame widgets
 */
map( frameProps =>
    new TFrame( merge( frameProps, {
        parent: screen,
    } ) )
)( config.frames )

screen.children[ 0 ].emit( "focus" )

/**
 *  Watch for file changes based on the combined patterns of all frames.
 *
 *  Screen will emit a `watch` event on file change event and each frame (that
 *  defined a `watch` pattern) will listen and respawn the process if it's
 *  pattern matches
 */
config.watch && watch( config.watch, {
    cwd          : process.cwd(),
    ignore       : config.ignore,
    ignoreInitial: true,
} ).on( "all", ( event, path ) => {
    screen.emit( "watch", path, event )
} )
