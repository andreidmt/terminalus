import test from "tape"
import tapDiff from "tap-diff"
import mapWithHistory from "../state"

test.createStream()
    .pipe( tapDiff() )
    .pipe( process.stdout )


test( "Immutable Map with history", assert => {

    const testMap = mapWithHistory( {
        lorem: "ipsum",
    } )

    assert.equal( "ipsum", testMap.get( "lorem" ),
        ".get - Get existing prop after init (expect string)" )

    assert.equal( undefined, testMap.get( "not-exist" ),
        ".get - Get non-existing prop after init (expect undefined)" )

    assert.equal( false, testMap.hasChanged( "lorem" ),
        ".hasChanged - Check prop after init (expect false)" )

    assert.equal( false, testMap.hasChanged( "not-exist" ),
        ".hasChanged - Check non-existing prop (expect false)" )

    testMap.set( {
        lorem: "ipsum dolor",
        sit  : "amen",
    } )

    assert.equal( "ipsum dolor", testMap.get( "lorem" ),
        ".get - Get updated prop" )

    assert.equal( true, testMap.hasChanged( "lorem" ),
        ".hasChanged - Updated prop (expect true)" )

    assert.equal( true, testMap.hasChanged( "sit" ),
        ".hasChanged - New prop (expect true)" )

    testMap.set( {
        lorem: "ipsum dolor",
    } )

    assert.equal( false, testMap.hasChanged( "lorem" ),
        ".hasChanged - Updated prop with same value (expect false)" )

    assert.equal( undefined, testMap.delete( "lorem" ).get( "lorem" ),
        ".delete.get - Chain: detele existing -> get (expect undefined)" )

    assert.equal( true, testMap.delete( "sit" ).hasChanged( "sit" ),
        ".delete.hasChanged - Chain: delete existing -> hasChanged` (expect true)" )

    assert.end()
} )

