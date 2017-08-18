"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getConfig = undefined;

var _ajv = require("ajv");

var _ajv2 = _interopRequireDefault(_ajv);

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

var _rc = require("rc");

var _rc2 = _interopRequireDefault(_rc);

var _fs = require("fs");

var _utils = require("../utils");

var U = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require("debug")("Terminalus:Config");

/**
 * Merge conf options from .dashboardrc and package.json scripts
 *
 * @param  {Object}  packageJSON  package.json content
 *
 * @return {Object}  { description_of_the_return_value }
 */
const _mergeWithRC = packageJSON => (0, _rc2.default)(packageJSON.name, {
    name: packageJSON.name,
    pkg_scripts: packageJSON.scripts
});

/**
 * Run config data through json schema validation
 *
 * @param  {Object}    data  The options
 *
 * @return {Function}  The layout position.
 */
const _validateConfig = data => {

    const schema = require("./schema.json");
    const validate = new _ajv2.default({
        useDefaults: true,
        allErrors: true,
        format: "full"
    }).compile(schema);

    const returnType = {
        true: () => data,
        false: () => {
            _ramda2.default.forEach([U.error("VALIDATION ERROR: config data"), validate.errors], console.log);

            process.exit(1);
        }
    };

    return returnType[validate(data)]();
};

/**
 * Size of an element with no size defined
 *
 * @param  {string[]}  items  Array of strings with "name:size" pattern
 *
 * @return {number}    Size of an element with no size defined
 */
const wildcardSize = items => {

    const sizeAcc = items.reduce((acc, item) => {
        const size = Number(item.split(":")[1]);

        return {
            size: size ? acc.size - size : acc.size,
            count: size ? acc.count : acc.count + 1
        };
    }, {
        size: 100,
        count: 0
    });

    return sizeAcc.count ? sizeAcc.size / sizeAcc.count : NaN;
};

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
            const undefSize = wildcardSize(layout);

            return layout.reduce((acc, column) => {
                const split = column.split(":");
                const constraint = coord.isTD ? coord.height : coord.width;
                const size = U.percent(Number(split[1]) || undefSize, constraint);

                return {
                    left: coord.isTD ? acc.left : acc.left + size,
                    top: coord.isTD ? acc.top + size : acc.top,
                    frames: [...acc.frames, {
                        slug: split[0],
                        top: `${acc.top}%`,
                        left: `${acc.left}%`,
                        width: `${coord.isTD ? coord.width : size}%`,
                        height: `${coord.isTD ? size : coord.height}%`
                    }]
                };
            }, Object.assign({}, coord, {
                frames: []
            }));
        },
        Object: () => {
            const undefSize = wildcardSize(Object.keys(layout));

            return Object.keys(layout).reduce((acc, item) => {
                const split = item.split(":");
                const isTD = split[0] === "td";
                const constraint = isTD ? coord.width : coord.height;

                // Find current element size (width or height, depending if
                // is TR or TD) as percentage or available constraint
                const size = U.percent(Number(split[1]) || undefSize, constraint);

                return {
                    coord: {
                        isTD,

                        // TD move horizontal, TR vertical
                        top: isTD ? acc.coord.top : acc.coord.top + size,
                        left: isTD ? acc.coord.left + size : acc.coord.left,
                        width: coord.width,
                        height: coord.height
                    },
                    frames: [...acc.frames, layoutPosition({
                        isTD,
                        top: acc.coord.top,
                        left: acc.coord.left,
                        width: isTD ? size : coord.width,
                        height: isTD ? coord.height : size
                    })(layout[item])]
                };
            }, {
                coord,
                frames: []
            });
        }
    };

    return _ramda2.default.flatten(byType[_ramda2.default.type(layout)](layout).frames);
};

/**
 * Parse package.json and merge with RC config
 *
 * @return {Object}  The configuration.
 */
const getConfig = exports.getConfig = () => _ramda2.default.pipe(

// read package.json content
_fs.readFileSync, JSON.parse,

// merge data from package.json and .rc file
_mergeWithRC,

// pass config through json schema
_validateConfig,

// calculate frames position based on the layout setting
config => _ramda2.default.set(_ramda2.default.lensProp("frames"),

// merge config frame settings with calculated positions
_ramda2.default.mergeDeepRight(_ramda2.default.pipe(_ramda2.default.pick(["layout"]), layoutPosition({
    isTD: true,
    top: 0,
    left: 0,
    width: 100,
    height: 100
}),

// proper tabbing
_ramda2.default.sortWith([_ramda2.default.ascend(_ramda2.default.prop("top")), _ramda2.default.ascend(_ramda2.default.prop("left"))]),

// array => obj indexed by frame slug
_ramda2.default.indexBy(_ramda2.default.prop("slug")))(config), _ramda2.default.view(_ramda2.default.lensProp("frames"), config)), config))(`${process.cwd()}/package.json`, { encoding: "utf8" });