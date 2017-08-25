"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = TMenu;

var _blessed = require("blessed");

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require("debug")("Terminalus:Menu");

// import chalk from "chalk"
// import unicode from "figures"

const DEFAULT_MENU_PROPS = {
    width: "shrink",
    keys: true,
    mouse: true,
    align: "left",
    alwaysScroll: true,
    border: "line",
    hidden: true,
    style: {
        selected: {
            bg: "blue"
        },
        focus: {
            border: {
                fg: "blue"
            }
        },
        border: {
            fg: "gray"
        }
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
};function TMenu(props) {

    /*
     * Guard against calls without new
     */
    if (!(this instanceof TMenu)) {
        return new TMenu(props);
    }

    /*
     * Parent constructor
     */
    _blessed.List.call(this, _ramda2.default.mergeAll([_ramda2.default.clone(DEFAULT_MENU_PROPS), _ramda2.default.pick(["parent", "top", "left"])(props), {
        height: props.items.length + 2,
        width: _ramda2.default.reduce((acc, elm) => Math.max(acc, elm.label.length), 0, props.items) + 4
    }]));

    /**
     * Attach passed in keyboard event handlers
     */
    _ramda2.default.forEachObjIndexed((fn, key) => {
        this.key(key, fn);
    })(props.onKey);

    /**
     * Add items with shortcuts
     */
    _ramda2.default.forEach(item => {
        this.addItem(` ${item.label} `);
        this.key(item.key, item.handler);
    }, props.items);

    /**
     * Enter pressed on item
     */
    this.on("select", (x, index) => {

        // selected item's handler
        props.items[index].handler();

        // general handler
        props.onSelect();
    });
}

TMenu.prototype = Object.create(_blessed.List.prototype, {
    type: {
        value: "tMenu",
        enumerable: true,
        configurable: true,
        writable: false
    }
});