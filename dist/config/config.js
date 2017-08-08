"use strict";

const debug = require("debug")("Terminalus:Config");
const Ajv = require("ajv");
const rc = require("rc");
const fs = require("fs");
const { errorBox } = require("../utils");
const M = require("../m");

/**
 * Merge conf options from .dashboardrc and package.json scripts
 *
 * @param {Object}  packageJSON package.json content
 * @return {Object}
 */
const _mergeWithRC = packageJSON => rc(packageJSON.name, {
    name: packageJSON.name,
    pkg_scripts: packageJSON.scripts
});

/**
 * Run config data through json schema validation
 *
 * @param      {Object}    data  The options
 * @return     {Function}  The layout position.
 */
const _validateConfig = data => {

    const schema = require("./schema.json");
    const validate = new Ajv({
        allErrors: true,
        format: "full",
        useDefaults: true
    }).compile(schema);

    const returnType = {
        true: () => data,
        false: () => {

            M.forEach([errorBox("VALIDATION ERROR: config data"), validate.errors], console.log);

            process.exit(1);
        }
    };

    return returnType[validate(data)]();
};

// =================================
//             Flow types          =
// =================================

// ======= End of Flow types =======

/**
 * Calculates frames positioning
 *
 * @param   {ConfigType}  config  Configuration data
 * @return  {ConfigType}
 * @example { example }
 */
const _computeFramePosition = config => {

    const height = 100 / config.layout.length;

    /**
     * Do ROWS
     */
    const framesFromLayout = config.layout.map((row, rowIndex) => {

        const top = rowIndex * height;

        // Pass through each column in row and see how much unallocated
        // width there is and how many columns.
        const wildcardWidth = M.pipe(currentRow => currentRow.reduce((acc, column) => {
            const colWidth = Number(column.split(":")[1]);

            return {
                width: colWidth ? acc.width - colWidth : acc.width,
                count: colWidth ? acc.count : acc.count + 1
            };
        }, {
            width: 100,
            count: 0
        }), data => M.round(data.width / data.count, 2))(row);

        /**
         * Do COLUMNS
         */
        return row.reduce((acc, column) => {

            const nameSplit = column.split(":");
            const width = Number(nameSplit[1]) || wildcardWidth;

            return {
                left: acc.left + width,
                frames: [...acc.frames, {
                    slug: nameSplit[0],
                    top: `${top}%`,
                    left: `${acc.left}%`,
                    width: `${width}%`,
                    height: `${height}%`
                }]
            };
        }, {
            left: 0,
            frames: []
        });
    })

    // flatten to an array of FramePositionType
    .reduce((acc, rowData) => [...acc, ...rowData.frames], []);

    // Merge position info on config frame obj ... pass through
    // framesFromLayout so the elements get initialized in the order defined
    // in the layout ... tab-in will be in the same order
    config.frames = framesFromLayout.reduce((acc, frameWithPos) => {

        acc[frameWithPos.slug] = Object.assign({}, config.frames[frameWithPos.slug], frameWithPos);

        return acc;
    }, {});

    return config;
};

/**
 * Parse package.json and merge with RC config
 *
 * @return {Object}
 */
const getConfig = () => M.pipe(fs.readFileSync, JSON.parse, _mergeWithRC, _validateConfig, _computeFramePosition)(`${process.cwd()}/package.json`, "utf8");

module.exports = {
    getConfig
};