"use strict";

/* eslint no-sync: "off" */
/* eslint no-console: "off" */

const _ajv = require("ajv");
const _rc = require("rc");
const _fs = require("fs");
const { errorBox } = require("./utils");
const M = require("./m");

/**
 * Merge conf options from .dashboardrc and package.json scripts
 *
 * @param {Object}  packageJSON package.json content
 * @return {Object}
 */
const _mergeWithRC = packageJSON => _rc(packageJSON.name, {
    pkg_scripts: packageJSON.scripts
});

/**
 * Run config data through json schema validation
 *
 * @param      {Object}    data  The options
 * @return     {Function}  The layout position.
 */
const _validateConfig = data => {

    const ajv = new _ajv({ useDefaults: true });
    const schema = require("./schemas/configSchema");
    const validate = ajv.compile(schema);

    const returnType = {
        true: () => data,
        false: () => {

            M.forEach([errorBox("VALIDATION ERROR: config data"), validate.errors], console.log);

            process.exit(1);
        }
    };

    return returnType[validate(data)]();
};

/**
 * Calculates the layout position .
 *
 * @param      {Object}    options  The options
 * @return     {Function}  The layout position.
 */
const _computeLayoutPosition = options => {

    const height = 100 / options.layout.length;

    options.layout.forEach((row, rowIndex) => {
        row.forEach((column, colIndex) => {
            const width = 100 / row.length;

            options.commands[column].top = `${rowIndex * height}%`;
            options.commands[column].left = `${colIndex * width}%`;
            options.commands[column].width = `${width}%`;
            options.commands[column].height = `${height}%`;
        });
    });

    return M.clone(options);
};

/**
 * Parse package.json and merge with RC config
 *
 * @return {Object}
 */
const getConfig = () => M.pipe(_fs.readFileSync, JSON.parse, _mergeWithRC, _validateConfig, _computeLayoutPosition)(`${process.cwd()}/package.json`, "utf8");

module.exports = {
    getConfig
};