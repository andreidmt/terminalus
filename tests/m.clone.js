const test = require( "tape" )
const M = require( "../source/m" )

test( "deep clone integers, strings and booleans", assert => {

    const expected = "something tos test"
    const actual = M.clone( "something to test" )

    assert.equal( actual, expected,
        "Given two values, .equal() should produce a nice bug report" )

    assert.end()
} )

