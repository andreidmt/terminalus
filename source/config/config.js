// @flow

// const _debug = require( "debug" )( "Terminalus:Config" )
const _ajv = require( "ajv" )
const _rc = require( "rc" )
const _fs = require( "fs" )
const { errorBox } = require( "../utils" )
const M = require( "../m" )

/**
 * Merge conf options from .dashboardrc and package.json scripts
 *
 * @param {Object}  packageJSON package.json content
 * @return {Object}
 */
const _mergeWithRC = ( packageJSON: Object ) =>
    _rc( packageJSON.name, {
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

    const ajv = new _ajv( { useDefaults: true } )
    const schema = require( "./schema" )
    const validate = ajv.compile( schema )

    const returnType = {
        true : () => data,
        false: () => {

            M.forEach( [
                errorBox( "VALIDATION ERROR: config data" ),
                validate.errors,
            ], console.log )

            process.exit( 1 )
        },
    }

    return returnType[ validate( data ) ]()
}

// =================================
//             Flow types          =
// =================================

import type { FramePropsType } from "../widgets/frame"

type FramePositionType = {
    slug: string;
    top: string;
    left: string;
    width: string;
    height: string;
}

type RowAccType = {
    left: number;
    totalWidth: number;
    baseWidth: number;
    frames: FramePositionType[];
}

export type ConfigType = {
    name: string;
    frames: {
        [string]: FramePropsType;
    };
    pkg_scripts: {
        [string]: string;
    };
    layout: [];
}

// ======= End of Flow types =======

/**
 * Calculates frames positioning
 *
 * @param   {ConfigType}  config  Configuration data
 * @return  {ConfigType}
 * @example { example }
 */
const _computeFramePosition = ( config: ConfigType ): ConfigType => {

    const height = M.round( 100 / config.layout.length, 2 )

    /**
     * Do ROWS
     */
    config.layout
        .map( ( row, rowIndex ) => {

            const top = rowIndex * height

            /**
             * Do COLUMNS
             */
            return row.reduce(
                ( acc: RowAccType, column, index: number ): RowAccType => {

                    const nameSplit = column.split( ":" )
                    const width = Number( nameSplit[ 1 ] ) || acc.baseWidth
                    const remWidth = acc.totalWidth - width
                    const remElements = row.length - ( index + 1 )
                    const remBaseWidth = M.round( remWidth / ( remElements || 1 ), 2 )

                    return {
                        left      : acc.left + width,
                        totalWidth: remWidth,
                        baseWidth : remBaseWidth,
                        frames    : [
                            ...acc.frames,
                            {
                                slug  : nameSplit[ 0 ],
                                top   : `${ top }%`,
                                left  : `${ acc.left }%`,
                                width : `${ width }%`,
                                height: `${ height }%`,
                            },
                        ],
                    }
                }, {
                    left      : 0,
                    totalWidth: 100,
                    baseWidth : M.round( 100 / row.length, 2 ),
                    frames    : [],
                } )
        } )

        // flatten to an array of FramePositionType
        .reduce(
            ( acc: FramePositionType[], rowData: RowAccType ) =>
                [ ...acc, ...rowData.frames ],
            []
        )

        // merge position info on config frame obj
        .forEach( ( frameWithPos: FramePositionType ) => {
            Object.assign( config.frames[ frameWithPos.slug ],
                frameWithPos )
        } )

    return config
}

/**
 * Parse package.json and merge with RC config
 *
 * @return {Object}
 */
const getConfig = () => M.pipe(
    _fs.readFileSync,
    JSON.parse,
    _mergeWithRC,
    _validateConfig,
    _computeFramePosition,
)( `${process.cwd()}/package.json`, "utf8" )

module.exports = {
    getConfig,
}
