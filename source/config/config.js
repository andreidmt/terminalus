// @flow

const debug = require( "debug" )( "Terminalus:Config" )
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

type WildcardWidthType = {
    width: number;
    count: number;
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

            const wildcardWidth = M.pipe(
                currentRow => currentRow.reduce(
                    ( acc: WildcardWidthType, column ): WildcardWidthType => {
                        const colWidth = Number( column.split( ":" )[ 1 ] )

                        return {
                            width: colWidth ? acc.width - colWidth : acc.width,
                            count: colWidth ? acc.count : acc.count + 1,
                        }
                    }, {
                        width: 100,
                        count: 0,
                    } ),
                ( data: WildcardWidthType ): number =>
                    M.round( data.width / data.count, 2 )
            )( row )

            /**
             * Do COLUMNS
             */
            return row.reduce(
                ( acc: RowAccType, column ): RowAccType => {

                    const nameSplit = column.split( ":" )
                    const width = Number( nameSplit[ 1 ] ) || wildcardWidth

                    return {
                        left  : acc.left + width,
                        frames: [
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
                    left  : 0,
                    frames: [],
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
    fs.readFileSync,
    JSON.parse,
    _mergeWithRC,
    _validateConfig,
    _computeFramePosition,
)( `${process.cwd()}/package.json`, "utf8" )

module.exports = {
    getConfig,
}
