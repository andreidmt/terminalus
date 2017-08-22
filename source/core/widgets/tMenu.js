const debug = require( "debug" )( "Terminalus:Menu" )

import { ListTable, List } from "blessed"
import R from "ramda"

// import chalk from "chalk"
// import unicode from "figures"

const DEFAULT_MENU_PROPS = {
    width       : "shrink",
    keys        : true,
    mouse       : true,
    align       : "left",
    alwaysScroll: true,
    border      : {
        type: "line",
    },
    style: {
        selected: {
            bg: "blue",
        },
        focus: {
            border: {
                fg: "blue",
            },
        },
        border: {
            fg: "gray",
        },
    },
}

/**
 * { function_description }
 *
 * @class  TMenu (name)
 *
 * @param  {<type>}  props  The properties
 *
 * @return {TMenu}   { description_of_the_return_value }
 */
export function TMenu( props ) {

    /*
     * Guard against calls without new
     */
    if ( !( this instanceof TMenu ) ) {
        return new TMenu( props )
    }

    /*
     * Parent constructor
     */
    List.call( this, R.mergeAll( [
        R.clone( DEFAULT_MENU_PROPS ),
        R.pick( [ "parent", "top", "left" ] )( props ),
        {
            height: props.items.length + 2,
            width : R.reduce( ( acc, elm ) =>
                Math.max( acc, elm.label.length ), 0, props.items ) + 4,
        },
    ] ) )

    /**
     * Attach passed in keyboard event handlers
     */
    R.forEachObjIndexed( ( fn, key ) => {
        this.key( key, fn )
    } )( props.onKey )

    /**
     * Add items with shortcuts
     */
    R.forEach( item => {
        this.addItem( ` ${item.label} ` )
        this.key( item.key, item.handler )
    }, props.items )


    /**
     * Enter pressed on item
     */
    this.on( "select", ( x, index ) => {

        // selected item's handler
        props.items[ index ].handler()

        // general handler
        props.onSelect()
    } )
}

TMenu.prototype = Object.create( List.prototype, {
    type: {
        value       : "tMenu",
        enumerable  : true,
        configurable: true,
        writable    : false,
    },
} )
