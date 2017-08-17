const debug = require( "debug" )( "Terminalus" )

import { getConfig } from "./core/config/config"
import { TFrame } from "./core/widgets/tFrame"
import { Screen } from "blessed"
import R from "ramda"

/**
 * Init config & screen
 */
const tConfig = getConfig()
const tScreen = new Screen( R.merge( {
    tabSize     : 4,
    smartCSR    : true,
    fullUnicode : true,
    forceUnicode: true,
    padding     : 0,
    autoPadding : true,
}, {
    title: tConfig.title,
} ) )

/**
 * Keyboard shortcuts
 */
tScreen.program.key( [ "C-c" ], () => {
    tScreen.destroy()
} )

tScreen.program.key( "tab", () => {
    tScreen.focusNext().render()
} )

tScreen.program.key( "S-tab", () => {
    tScreen.focusPrevious().render()
} )

tScreen.program.key( "escape", () => {
    tScreen.focused.emit( "blur" )
    tScreen.render()
} )

/**
 * Add frames
 */
Object
    .values( tConfig.frames )
    .forEach( frameProps => new TFrame(
        R.merge( frameProps, {
            parent: tScreen,
        } )
    ) )

tScreen.focused = tScreen.children[ 0 ]
tScreen.render()
