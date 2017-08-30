"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = stateHistoryFactory;

var _immutable = require("immutable");

var _ramda = require("ramda");

var _utils = require("../../core/utils");

const debug = require("debug")("Terminalus:stateHistoryFactory");

/**
 * Object with get/set/hasChanged, interfacing immutable map and keeping
 * history
 *
 * @class   stateHistoryFactory
 *
 * @param   {Object}    state            The initial state
 * @param   {Object}    opt              State options
 * @param   {number}    opt.maxLength    How many changes should be remembered
 * @param   {number}    opt.pure         Run afterUpdate only if prev & next
 *                                       are different
 * @param   {Function}  opt.afterUpdate  Callback after running set
 *
 * @return  {Object}  Object interfacing immutable map
 *
 * @example
 * const state = stateHistoryFactory( {
 *     lorem: "ipsum"
 * }, {
 *     maxLength: 2,
 *     afterUpdate: (prevState, nextState) => {
 *         console.log( nextState.get("lorem") )
 *     }
 * } )
 */
function stateHistoryFactory(state = {}, opt) {

    // + unshift
    // - pop
    const stack = [new _immutable.Map(state)];
    const props = (0, _ramda.merge)({
        maxLength: 2
    }, opt);

    /**
     * Run update once every 30ms
     *
     * @type {Function}
     */
    const throttledAfterUpdate = (0, _utils.throttle)(() => {
        // trigger callback with prev & next versions
        if (!(0, _immutable.is)(stack[1], stack[0])) {
            props.afterUpdate(stack[1], stack[0]);
        }
    }, {
        time: 30,
        lastCall: true
    });

    return {
        /**
         * Get value from lates version
         *
         * @param  {string}  key  The data
         *
         * @return {*}       Value saved under `key` or undefined
         */
        get(key) {
            return stack[0].get(key);
        },

        /**
         * Set new value with history
         *
         * @param {Object}  data  Merge with latest saved values
         *
         * @return {Object}  stateHistoryFactory
         */
        set(data) {
            // add at the begining
            stack.unshift(stack[0].merge(data));

            // pop one if history too big
            stack.length > props.maxLength && stack.pop();

            // run user callback
            props.afterUpdate && throttledAfterUpdate();

            return this;
        },

        /**
         * Check if value under key has changed
         *
         * @param  {string[]}  keys  The keys
         *
         * @return {boolean}   True if has changed, False otherwise.
         */
        hasChanged(...keys) {
            return keys.reduce((acc, key) => stack.length > 1 && !(0, _immutable.is)(stack[1].get(key), stack[0].get(key)) || acc, false);
        }
    };
}