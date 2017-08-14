// @flow

const debug = require( "debug" )( "Terminalus:Config" )

// const R = require( "ramda" )
const Ajv = require( "ajv" )
const rc = require( "rc" )
const fs = require( "fs" )
const { errorBox } = require( "../utils" )
const M = require( "../m" )

/**
 * Merge conf options from .dashboardrc and package.json scripts
 *
 * @param {Object}  packageJSON package.json content
 * @return {Object}
 */
const _mergeWithRC = ( packageJSON: Object ) =>
    rc( packageJSON.name, {
        name       : packageJSON.name,
        pkg_scripts: packageJSON.scripts,
    } )

/**
 * Run config data through json schema validation
 *
 * @param      {Object}    data  The options
 * @return     {Function}  The layout position.
 */
const _validateConfig = ( data: Object ) => {
    const schema = require( "./schema.json" )
    const validate = new Ajv( {
        allErrors  : true,
        format     : "full",
        useDefaults: true,
    } ).compile( schema )

    const returnType = {
        true : () => data,
        false: () => {
            M.forEach(
                [ errorBox( "VALIDATION ERROR: config data" ), validate.errors ],
                console.log,
            )

            process.exit( 1 )
        },
    }

    return returnType[ validate( data ) ]()
}

/**
 * Size of an element with no size defined
 *
 * @param {string[]} items Array of strings with "name:size" pattern
 *
 * @return {number} Size of an element with no size defined
 */
const wildcardSize = ( items: string[] ): number => {
    type SizeAccType = {
        size: number;
        count: number;
    }

    const sizeAcc = items.reduce(
        ( acc: SizeAccType, item: string ): SizeAccType => {
            const size: number = Number( item.split( ":" )[ 1 ] )

            return {
                size : size ? acc.size - size : acc.size,
                count: size ? acc.count : acc.count + 1,
            }
        },
        {
            size : 100,
            count: 0,
        },
    )

    return sizeAcc.count ? sizeAcc.size / sizeAcc.count : NaN
}

import type { FramePropsType } from "../widgets/frame"

type CoordType = {
    isTD: boolean;
    top: number;
    left: number;
    width: number;
    height: number;
}

type LayoutType = {
    [string]: LayoutType | Array <string>;
}

type FramePositionType = {
    slug: string;
    top: string;
    left: string;
    width: string;
    height: string;
}

export type ConfigType = {
    name: string;
    frames: {
        [string]: FramePropsType;
    };
    pkg_scripts: {
        [string]: string;
    };
    layout: LayoutType;
}

const calcPositions = (
    layout: LayoutType,
    coord: CoordType,
): FramePositionType[] => {
    const byType = {
        Array: () => {
            const undefSize = wildcardSize( layout )

            return layout.reduce( ( acc, column ) => {
                const split = column.split( ":" )
                const constraint = coord.isTD ? coord.height : coord.width
                const size = M.percent(
                    Number( split[ 1 ] ) || undefSize,
                    constraint,
                    2
                )

                return {
                    left  : coord.isTD ? acc.left : acc.left + size,
                    top   : coord.isTD ? acc.top + size : acc.top,
                    frames: [
                        ...acc.frames,
                        {
                            slug  : split[ 0 ],
                            top   : acc.top,
                            left  : acc.left,
                            width : coord.isTD ? coord.width : size,
                            height: coord.isTD ? size : coord.height,
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
                const size = M.percent(
                    Number( split[ 1 ] ) || undefSize,
                    constraint,
                    2
                )

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
                        calcPositions( layout[ item ], {
                            isTD,
                            top   : acc.coord.top,
                            left  : acc.coord.left,
                            width : isTD ? size : coord.width,
                            height: isTD ? coord.height : size,
                        } ),
                    ],
                }
            },
            {
                coord,
                frames: [],
            },
            )
        },
    }

    return M.flatten( byType[ M.type( layout ) ]( layout ).frames )
}

/**
 * Parse package.json and merge with RC config
 *
 * @return {Object}
 */
const getConfig = (): ConfigType =>
    M.pipe(
        fs.readFileSync,
        JSON.parse,
        _mergeWithRC,
        _validateConfig,
        ( config: ConfigType ) => {

            config.frames = calcPositions(
                config.layout, {
                    isTD  : true,
                    top   : 0,
                    left  : 0,
                    width : 100,
                    height: 100,
                } )

                // Merge positions with frame options
                .reduce( ( acc, frameWithPos: FramePositionType ) => {
                    acc[ frameWithPos.slug ] = Object.assign(
                        {},
                        config.frames[ frameWithPos.slug ],

                        // Transform position to percent string
                        // (blessed format)
                        {
                            top   : `${frameWithPos.top }%`,
                            left  : `${frameWithPos.left }%`,
                            width : `${frameWithPos.width }%`,
                            height: `${frameWithPos.height }%`,
                        },
                    )

                    return acc
                }, {} )

            return config
        },
    )( `${process.cwd()}/package.json`, "utf8" )

module.exports = {
    getConfig,
}
