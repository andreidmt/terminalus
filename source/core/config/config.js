const debug = require( "debug" )( "Terminalus:Config" )

import Ajv from "ajv"
import R from "ramda"
import rc from "rc"
import { readFileSync } from "fs"
import * as U from "../utils"

/**
 * Run config data through json schema validation
 *
 * @param  {Object}    condfigData  The condfig data
 *
 * @return {Function}  The layout position.
 */
const validateConfig = configData => {

    const validate = new Ajv( {
        useDefaults: true,
        allErrors  : true,
        format     : "full",
    } ).compile( require( "./schema.json" ) )

    const isValid = {
        true : () => configData,
        false: () => {
            console.log( U.error( "VALIDATION ERROR: config data" ) )
            console.log( validate.errors )
            process.exit( 1 )
        },
    }

    return isValid[ validate( configData ) ]()
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

            return Object.keys( layout ).reduce( ( acc, name ) => {
                const split = name.split( ":" )
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
                        } )( layout[ name ] ),
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
 * Check if frame.cmd is a npm script. Update frame.cmd & frame.args to be
 * compatible to child_process.spawn
 *
 * @param  {Object[]}  scripts  package.json scripts
 * @param  {Object[]}  frames   Config frames
 *
 * @return {Object[]}  Updated frames object
 */
const replaceIfNPMScript = config =>
    R.map( frame =>
        R.ifElse(
            R.has( frame.cmd ),
            () => R.merge( frame, {
                cmd : "npm",
                args: R.concat( [ "run", frame.cmd ], frame.args ),
            } ) ,
            () => frame
        )( config.scripts )
    )( config.frames )

/**
 * { lambda_description }
 *
 * @param  {<type>}  config  The configuration
 *
 * @return {<type>}  { description_of_the_return_value }
 */
const joinWithPositions = config =>
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
    )

/**
 * Parse package.json, merge with RC config, json validate
 *
 * @return {Object}  The configuration.
 */
export const getConfig = () => R.pipe(

    // Read package.json content
    readFileSync,
    JSON.parse,

    // Merge data from package.json and .rc file
    pkgJSON => rc( pkgJSON.name, {
        name        : pkgJSON.name,
        scripts     : pkgJSON.scripts,
        dependencies: R.merge(
            pkgJSON.dependencies,
            pkgJSON.devDependencies,
        ),
    } ),

    // Pass config through json schema
    validateConfig,

    // Check if frame.cmd is a npm script
    config => R.set(
        R.lensProp( "frames" ),
        replaceIfNPMScript( config ),
    )( config ),

    // Join each frame.watch into config.watch
    config => R.set(
        R.lensProp( "watch" ),
        R.pipe(
            R.pluck( "watch" ),
            R.reject( R.isNil ),
            R.values,
            R.uniq,
        )( config.frames )
    )( config ),

    // Calculate frames position based on the layout setting and merge with
    // frame config
    config => R.set(
        R.lensProp( "frames" ),
        joinWithPositions( config ),
    )( config )
)( `${process.cwd()}/package.json`, { encoding: "utf8" } )
