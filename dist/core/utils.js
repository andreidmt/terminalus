"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const debug = require("debug")("Terminalus:Util");
const chalk = require("chalk");

// const I = require( "immutable" )
// const R = require( "ramda" )

/**
 * Format success text
 *
 * @param   {string}  input  The input string
 * @return  {string}  Underlined green text
 * @example console.log( success( "happy" ) )
 */
const success = exports.success = input => chalk.green([input, "------------"].join("\n"));

/**
 * Format error text
 *
 * @param   {string}  input  The input string
 * @return  {string}  Underlined red text
 * @example console.log( error( "sad" ) )
 */
const error = exports.error = input => chalk.red([input, "------------"].join("\n"));

/**
 * Format info text
 *
 * @param   {string}  input  The input string
 * @return  {string}  Underlined blue text
 * @example console.log( error( "meh" ) )
 */
const info = exports.info = input => chalk.blue([input, "------------"].join("\n"));

/**
 * Format process.hrtime to show seconds & milliseconds or just
 * milliseconds
 *
 * @param   {number[]}  hrtime  The hrtime number
 * @return  {string}    Formatted string
 * @example { example }
 */
const formatHRTime = exports.formatHRTime = hrtime => {
  const ms = Math.round(hrtime[1] / 10000) / 100;

  return hrtime[0] ? `${hrtime[0]}s ${ms}ms` : `${ms}ms`;
};

/**
 * { function_description }
 *
 * @param   {number}    input     The input number
 * @param   {number}    decimals  The decimal places number
 * @return  {number}  { description_of_the_return_value }
 * @example round( 3.4456, 2 ) // 3.45
 */
const round = exports.round = (input, decimals = 2) => Number(input.toFixed(decimals));

/**
 * { item_description }
 *
 * @param {number} x { parameter_description }
 * @param {number} y { parameter_description }
 * @param {number} decimals { parameter_description }
 *
 * @return {number} { description_of_the_return_value }
 */
const percent = exports.percent = (x, y, decimals = 2) => round(x / 100 * y, decimals);

/**
 * Return an array of constructor function names based on the prototype chain
 *
 * @param {Object} obj - Source object
 * @param {string[]} acc - Accumulator array
 *
 * @returns {string[]}
 */
const protoChain = exports.protoChain = (obj, acc = []) => {
  const proto = Object.getPrototypeOf(obj);

  return proto ? protoChain(proto, [...acc, proto.constructor.name]) : acc;
};