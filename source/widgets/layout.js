// @flow

const debug = require( "debug" )( "Terminalus:Layout" )
const { Screen } = require( "blessed" )
const M = require( "../m" )
const { getFrame } = require( "./frame" )

const DEFAULT_LAYOUT_PROPS = {
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

import type { FramePropsType } from "./frame"

type LayoutPropsType = {
    title: string;
    frames: {
        [string]: FramePropsType;
    };
}

type LayoutType = {

} & Blessed$Screen

// ======= End of Flow types =======


/**
 * Factory function for creating new Command Layout widget objects
 *
 * @param  {LayoutPropsType}  options  asd
 *
 * @return {CMDLogType}         New Command Layout object
 */
const LayoutFactory = ( options: LayoutPropsType ): LayoutType => {

    const layoutWidget = new Screen( Object.assign( {},
        M.clone( DEFAULT_LAYOUT_PROPS ),
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

    Object.values( options.frames ).forEach( ( frame: FramePropsType ) => {
        getFrame( Object.assign( {}, {
            parent: layoutWidget,
        }, frame ) )
    } )

    return layoutWidget
}

module.exports = {
    getLayout: LayoutFactory,
}
