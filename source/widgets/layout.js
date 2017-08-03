// @flow

// const _debug = require( "debug" )( "Dashboard:CMDLayout" )
const { Screen } = require( "blessed" )
const M = require( "../m" )
const { getCMDLog } = require( "./command" )

const DEFAULT_LAYOUT_OPTIONS = {
    tabSize     : 4,
    smartCSR    : true,
    fullUnicode : true,
    forceUnicode: true,
    padding     : 0,
    autoPadding : true,
}

// =================================
//             Flow types          =
// =================================

import type { CommandOptionsType } from "./command"

type LayoutOptionsType = {
    title: string;
    commands: CommandOptionsType[];
}

type LayoutType = {

} & Blessed$Screen

// ======= End of Flow types =======


/**
 * Factory function for creating new Command Layout widget objects
 *
 * @param  {LayoutOptionsType}  options  asd
 *
 * @return {CMDLogType}         New Command Layout object
 */
const CMDLayoutFactory = ( options: LayoutOptionsType ): LayoutType => {

    const layoutWidget = new Screen( Object.assign( {},
        M.clone( DEFAULT_LAYOUT_OPTIONS ),
        {
            title: options.title,
        }
    ) )

    layoutWidget.program.key( [ "C-c" ], () => {
        layoutWidget.destroy()
    } )

    layoutWidget.program.key( "tab", () => {
        layoutWidget.focusNext().render()
    } )

    layoutWidget.program.key( "S-tab", () => {
        layoutWidget.focusPrevious().render()
    } )

    options.commands.forEach( command => {
        getCMDLog( Object.assign( {}, {
            parent: layoutWidget,
        }, command ) )
    } )

    return layoutWidget
}

module.exports = {
    getCMDLayout: CMDLayoutFactory,
}
