"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = StateWithHistory;

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Object with get/set/changed, interfacing immutable map
 *
 * @param   {Object}    initialState   The initial state
 * @param   {Object}    opt            The option
 * @param   {number}    opt.maxLength  How many changes should be remembered
 * @param   {Function}  opt.afterSet   Callback after running set
 *
 * @return  {Object}    Object with get/set/changed, interfacing immutable map
 *
 * @example const state = stateWithHistory({lorem: "ipsum"})
 */
// const debug = require( "debug" )( "Terminalus:StateWithHistory" )

function StateWithHistory(initialState = {}, opt) {

    // + unshift
    // - pop
    const history = [new _immutable2.default.Map(initialState)];
    const props = _ramda2.default.merge({
        maxLength: 2
    }, opt);

    /**
     * Helper function for house cleaning after and update operation
     * (set/delete) was ran
     *
     * @return  {undefined}
     */
    const afterUpdate = () => {
        // pop one out if history too big (unshift returns the new length)
        history.length > props.maxLength && history.pop();

        // trigger callback with current & prev versions
        props.afterSet && props.afterSet(history[0], history[1]);
    };

    return {
        /**
         * Get value from lates version
         *
         * @param  {string}  key  The data
         *
         * @return {*}  undefined if key not defined of watever value
         */
        get(key) {
            return history[0].get(key);
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
            history.unshift(history[0].merge(data));

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
            history.unshift(history[0].delete(key));

            // check history length & run user callback
            afterUpdate();

            return this;
        },

        /**
         * Check if value under key has changed
         *
         * @param  {string}   key  The key
         *
         * @return {boolean}  True if has changed, False otherwise.
         */
        hasChanged(key) {
            return history.length > 1 && !_immutable2.default.is(history[1].get(key), history[0].get(key));
        }
    };
}