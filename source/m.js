// @flow

// eslint-disable-next-line no-unused-vars
const _debug = require( "debug" )( "Dashboard:M" )

/**
 * In goes me, out goes other me
 *
 * @param      {*}  me Little ol' me
 * @return     {*}
 */
const identity = <T> ( me: T ): T => me

/**
 * Determines if nothing, null or undefined.
 *
 * @param      {*}        input   The input
 * @return     {boolean}  True if nothing
 */
const isNil = <T> ( input: T ): boolean =>
    input === null || input === undefined

/**
 * Determines if something, not null or undefined.
 *
 * @param      {*}        input   The input
 * @return     {boolean}  True if something
 */
const isSomething = <T> ( input: T ): boolean =>
    input !== null && input !== undefined

/**
 * From ramda: Gives a single-word string description of the (native) type of
 * a value, returning such answers as "Object", "Number", "Array", or "Null".
 *
 * Does not attempt to distinguish user Object types any further, reporting
 * them all as "Object".
 *
 * @param {T} input Something to check type on
 * @example
 * type({})            //=> "Object"
 * type(1)             //=> "Number"
 * type(false)         //=> "Boolean"
 * type("s")           //=> "String"
 * type(null)          //=> "Null"
 * type([])            //=> "Array"
 * type(/[A-z]/)       //=> "RegExp"
 * type(new Date())    //=> "Date"
 * type(() => {})      //=> "Function"
 *
 * @return {string}
 */
const type = <T> ( input: T ): string =>
    input === null ? "Null" :
        input === undefined ? "Undefined" :
            Object.prototype.toString.call( input ).slice( 8, -1 )

/**
 * Check if source is of a certain type
 *
 * @param {string} _type - What type to check against
 * @param {mixed} source - What type to check against

 * @return {boolean} If source is of type
 */
const is = ( _type: string, source: mixed ): boolean =>
    _type === type( source )

/**
 * Iterate over an input list, calling `fn` for each element in the list.
 *
 * @param   {T}         list  The array
 * @param   {Function}  fn    The function
 *
 * @type    {T:[]}
 *
 * @return  {T}
 * @example { example }
 */
const forEach = <T: mixed[]> ( list: T, fn: Function ): T => {
    for ( let i = 0; i < list.length; i++ ) {
        fn( list[ i ] )
    }

    return list
}

/**
 * { function_description }
 *
 * @type    {<type>}
 * @example { example }
 */
const forEachKey = <T: { [key: string]: mixed }> (
    input: T,
    fn: ( key: string, value: mixed ) => void
): T => {

    const keys = Object.getOwnPropertyNames( input )

    for ( let i = 0; i < keys.length; i++ ) {
        fn( keys[ i ], input[ keys[ i ] ] )
    }

    return input
}

/**
 * { function_description }
 *
 * @param   {number}    input          The input number
 * @param   {number}    decimalPlaces  The decimal places number
 * @return  {number}  { description_of_the_return_value }
 * @example
 * round(3.4456,2) //=>
 */
const round = ( input: number, decimalPlaces: number = 0 ) => {
    const powOf10 = 10 ** decimalPlaces

    return Math.round( input * powOf10 ) / powOf10
}

/**
 * Performs left-to-right function composition. The leftmost function may have
 * any arity; the remaining functions must be unary.
 *
 * @param      {Array}  fns  The functions
 * @return     {Any}
 */
const pipe = ( ...fns: Function[] ) => ( ...input: mixed[] ): mixed => {
    const [ first ] = fns
    const [ ,...rest ] = fns

    return rest.reduce(
        ( acc, current ) => current.call( null, acc ),
        first.apply( null, input )
    )
}

/**
 * Creates a new instance of the object with same properties than original.
 *
 * @param {T}  toBeCloned  To be cloned
 * @return {T}  Copy of this object.
 *
 * @type    {T}
 * @example { example }
 */
const clone = <T>( toBeCloned: T ): T => {

    const byType = {
        Null     : () => null,
        Undefined: () => undefined,
        Number   : identity,
        String   : identity,
        Boolean  : identity,
        Function : identity,
        Array    : ( input: mixed[] ) => input.map( elm => clone( elm ) ),
        Date     : ( input: Date ) => new Date( input.getTime() ),
        Object   : ( input: Object ) => {

            const newObj = {}

            Object.keys( input ).forEach( property => {
                newObj[ property ] = clone( input[ property ] )
            } )

            return newObj
        },
    }

    return byType[ type( toBeCloned ) ]( toBeCloned )
}

/**
 * Create or modify a property on a object
 *
 * @param      {string}  prop    Property name
 * @param      {mixed}   value   Property value
 * @param      {Object}  source  Source object
 *
 * @return     {Object}  Modified source object
 *
 * @example
 *
 * M.set( "a", "lorem" )( { b: "ipsum" } )
 * // { a: "lorem", b: "ipsum" }
 */
const set = ( prop: string, value: mixed ): Function => <T>( source: T ): T =>
    Object.defineProperty( source, prop, {
        value,
        writable    : true,
        configurable: true,
        enumerable  : true,
    } )


/**
 * { item_description }
 */
const setAll = ( toBeAdded: {} ): Function => <T>( source: T ): T => {
    forEachKey( toBeAdded, ( key, value ) => {
        set( key, value )( source )
    } )

    return source
}

/**
 * Returns a partial copy of an object containing only the keys specified.
 * If the key does not exist, the property is ignored.
 *
 * @param      {Array <string>} properties  The properties to be filtered out
 * @param      {Object}         source      The source object
 * @return     {Object}
 */
const pick = ( properties: string[], source: Object ): Object =>
    properties
        .filter( ( item: string ) =>
            Object.hasOwnProperty.call( source, item ) )
        .reduce( ( acc, item ) =>
            set( item, source[ item ] )( acc ), {} )

/**
 * Return an array of constructor function names based on the prototype chain
 *
 * @param {Object} obj - Source object
 * @param {string[]} acc - Accumulator array
 *
 * @returns {string[]}
 */
const protoChain = ( obj: Object, acc: string[] = [] ): string[] => {
    const proto: {} = Object.getPrototypeOf( obj )

    return proto ? protoChain( proto, [ ...acc, proto.constructor.name ] ) : acc
}

/**
 * Check if a is equal to b (strict equality)
 *
 * @param {T}  a  First value
 * @param {T}  b  Second value
 *
 * @type    {T}
 * @example { example }
 */
const equals = <T> ( a: T ) => ( b: T ) => a === b

/**
 * If condition is true then run `fn` on passed input
 *
 * @param  {Function}   condition  Condition function
 * @param  {Function}   thenfn     Then function
 * @param  {?Function}  elsefn     Else function
 * @param  {mixed}      source
 *
 * @return {source|thenFn(source)|elseFn(source)}
 */
const If = ( ifCond: Function, thenFn: Function, elseFn: ?Function ) =>
    ( source: mixed ): mixed =>
        ifCond( source ) === true ? thenFn( source ) :
            typeof elseFn === "function" ? elseFn( source ) : source

//
//
module.exports = {
    identity,
    isNil,
    type,
    is,
    forEach,
    forEachKey,
    pipe,
    clone,
    set,
    setAll,
    pick,
    protoChain,
    equals,
    if: If,
    isSomething,
    round,
}
