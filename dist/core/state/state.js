"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = StateWithHistory;

var _immutable = require("immutable");

var _ramda = require("ramda");

var _utils = require("../../core/utils");

const debug = require("debug")("Terminalus:StateWithHistory");

/**
 * Object with get/set/delete/hasChanged, interfacing immutable map and keeping
 * history
 *
 * @param {Object}    initialState     The initial state
 * @param {Object}    opt              The option
 * @param {number}    opt.maxLength    How many changes should be remembered
 * @param {Function}  opt.afterUpdate  Callback after running set/delete
 *
 * @return  {Object}  Object with get/set/changed, interfacing immutable map
 *
 * @example const state = stateWithHistory({lorem: "ipsum"})
 */
function StateWithHistory(initialState = {}, opt) {

    // + unshift
    // - pop
    const stack = [new _immutable.Map(initialState)];
    const props = (0, _ramda.merge)({
        maxLength: 2
    }, opt);

    /**
     * Helper function for house cleaning after and update operation
     * (set/delete) was ran
     *
     * @return  {undefined}
     */
    const afterUpdate = (0, _utils.throttle)(() => {
        // pop one out if history too big (unshift returns the new length)
        stack.length > props.maxLength && stack.pop();

        // trigger callback with prev & next versions
        props.afterUpdate && props.afterUpdate(stack[1], stack[0]);
    }, {
        time: 50,
        lastCall: true
    });

    return {
        /**
         * Get value from lates version
         *
         * @param  {string}  key  The data
         *
         * @return {*}  undefined if key not defined of watever value
         */
        get(key) {
            return stack[0].get(key);
        },

        /**
         * Set new value with history
         *
         * @param {Object}  data
         *
         * @return {Object} StateWithHistory
         */
        set(data) {

            // add at the begining new map obj with data merged
            stack.unshift(stack[0].merge(data));

            // check history length & run user callback
            afterUpdate();

            return this;
        },

        /**
         * { function_description }
         *
         * @param {string}  key  The key
         */
        delete(key) {

            // add at the begining new map whithout key
            stack.unshift(stack[0].delete(key));

            // check history length & run user callback
            afterUpdate();

            return this;
        },

        /**
         * Check if value under key has changed
         *
         * @param  {string}   ...keys
         *
         * @return {boolean}  True if has changed, False otherwise.
         */
        hasChanged(...keys) {
            return keys.reduce((acc, key) => stack.length > 1 && !(0, _immutable.is)(stack[1].get(key), stack[0].get(key)) || acc, false);
        }
    };
}