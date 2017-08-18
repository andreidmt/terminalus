const debug = require( "debug" )( "Terminalus:Config" )

import Ajv from "ajv"
import R from "ramda"
import rc from "rc"
import { readFileSync } from "fs"
import * as U from "../utils"

/**
 * Merge conf options from .dashboardrc and package.json scripts
 *
 * @param  {Object}  packageJSON  package.json content
 *
 * @return {Object}  { description_of_the_return_value }
 */
const _mergeWithRC = packageJSON =>
    rc( packageJSON.name, {
        name       : packageJSON.name,
        pkg_scripts: packageJSON.scripts,
    } )

/**
 * Run config data through json schema validation
 *
 * @param  {Object}    data  The options
 *
 * @return {Function}  The layout position.
 */
const _validateConfig = data => {

    const schema = require( "./schema.json" )
    const validate = new Ajv( {
        useDefaults: true,
        allErrors  : true,
        format     : "full",
    } ).compile( schema )

    const returnType = {
        true : () => data,
        false: () => {
            R.forEach( [
                U.error( "VALIDATION ERROR: config data" ),
                validate.errors,
            ], console.log )

            process.exit( 1 )
        },
    }

    return returnType[ validate( data ) ]()
}

/**
 * Size of an element with no size defined
 *
 * @param  {string[]}  items  Array of strings with "name:size" pattern
 *
 * @return {number}    Size of an element with no size defined
 */
const wildcardSize = items => {

    const sizeAcc = items.reduce(
        ( acc, item ) => {
            const size = Number( item.split( ":" )[ 1 ] )

            return {
                size : size ? acc.size - size : acc.size,
                count: size ? acc.count : acc.count + 1,
            }
        }, {
            size : 100,
            count: 0,
        },
    )

    return sizeAcc.count ? sizeAcc.size / sizeAcc.count : NaN
}

/**
 * Calculates the frame positions
 *
 * @param {Object}   layout        The layout
 * @param {Object}   coord         The coordinate
 * @param {boolean}  coord.isTD    The coordinate
 * @param {number}   coord.width   The coordinate
 * @param {number}   coord.height  The coordinate
 *
 * @return {Object[]}  Array of {top, left, width, height}
 */
const layoutPosition = coord => layout => {

    const byType = {
        Array: () => {
            const undefSize = wildcardSize( layout )

            return layout.reduce( ( acc, column ) => {
                const split = column.split( ":" )
                const constraint = coord.isTD ? coord.height : coord.width
                const size = U.percent(
                    Number( split[ 1 ] ) || undefSize,
                    constraint )

                return {
                    left  : coord.isTD ? acc.left : acc.left + size,
                    top   : coord.isTD ? acc.top + size : acc.top,
                    frames: [
                        ...acc.frames,
                        {
                            slug  : split[ 0 ],
                            top   : `${acc.top}%`,
                            left  : `${acc.left}%`,
                            width : `${coord.isTD ? coord.width : size}%`,
                            height: `${coord.isTD ? size : coord.height}%`,
                        },
                    ],
                }
            },
            Object.assign( {}, coord, {
                frames: [],
            } ),
            )
        },
        Object: () => {
            const undefSize = wildcardSize( Object.keys( layout ) )

            return Object.keys( layout ).reduce( ( acc, item ) => {
                const split = item.split( ":" )
                const isTD = split[ 0 ] === "td"
                const constraint = isTD ? coord.width : coord.height

                // Find current element size (width or height, depending if
                // is TR or TD) as percentage or available constraint
                const size = U.percent(
                    Number( split[ 1 ] ) || undefSize,
                    constraint )

                return {
                    coord: {
                        isTD,

                        // TD move horizontal, TR vertical
                        top   : isTD ? acc.coord.top : acc.coord.top + size,
                        left  : isTD ? acc.coord.left + size : acc.coord.left,
                        width : coord.width,
                        height: coord.height,
                    },
                    frames: [
                        ...acc.frames,
                        layoutPosition( {
                            isTD,
                            top   : acc.coord.top,
                            left  : acc.coord.left,
                            width : isTD ? size : coord.width,
                            height: isTD ? coord.height : size,
                        } )( layout[ item ] ),
                    ],
                }
            }, {
                coord,
                frames: [],
            } )
        },
    }

    return R.flatten( byType[ R.type( layout ) ]( layout ).frames )
}

/**
 * Parse package.json and merge with RC config
 *
 * @return {Object}  The configuration.
 */
export const getConfig = () => R.pipe(

    // read package.json content
    readFileSync,
    JSON.parse,

    // merge data from package.json and .rc file
    _mergeWithRC,

    // pass config through json schema
    _validateConfig,

    // calculate frames position based on the layout setting
    config => R.set(
        R.lensProp( "frames" ),

        // merge config frame settings with calculated positions
        R.mergeDeepRight(
            R.pipe(
                R.pick( [ "layout" ] ),
                layoutPosition( {
                    isTD  : true,
                    top   : 0,
                    left  : 0,
                    width : 100,
                    height: 100,
                } ),

                // proper tabbing
                R.sortWith( [
                    R.ascend( R.prop( "top" ) ),
                    R.ascend( R.prop( "left" ) ),
                ] ),

                // array => obj indexed by frame slug
                R.indexBy( R.prop( "slug" ) ),

            )( config ),
            R.view( R.lensProp( "frames" ), config ),
        ), config ),

)( `${process.cwd()}/package.json`, { encoding: "utf8" } )
