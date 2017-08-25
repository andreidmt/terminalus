import test from "tape"
import tapDiff from "tap-diff"
import mapWithHistory from "../state"

test.createStream()
    .pipe( tapDiff() )
    .pipe( process.stdout )


test( "Immutable Map with history", assert => {

    const testMap = mapWithHistory( {
        single : "leave me alone",
        single2: "leave me alone too",
        update : "paarty",
        boolean: true,
    } )

    assert.equal( "leave me alone", testMap.get( "single" ),
        ".get - Get existing prop after init (expect string)" )

    assert.equal( undefined, testMap.get( "not-exist" ),
        ".get - Get non-existing prop after init (expect undefined)" )

    assert.equal( true, testMap.get( "boolean" ),
        ".get - Get boolean prop after init (expect true)" )

    //
    //
    testMap.set( {
        boolean: !testMap.get( "boolean" ),
        update : "ooh yeah",
        new    : "im blue",
    } )

    assert.equal( false, testMap.get( "boolean" ),
        ".set,.get - Get boolean prop after toggle (expect false)" )

    assert.equal( "ooh yeah", testMap.get( "update" ),
        ".set,.get - Get updated prop" )

    assert.equal( false, testMap.hasChanged( "single" ),
        ".hasChanged - Check prop after init (expect false)" )

    assert.equal( false, testMap.hasChanged( "not-exist" ),
        ".hasChanged - Check non-existing prop (expect false)" )

    assert.equal( true, testMap.hasChanged( "update" ),
        ".hasChanged - Updated prop (expect true)" )

    assert.equal( true, testMap.hasChanged( "new" ),
        ".hasChanged - New prop (expect true)" )

    assert.equal( true, testMap.hasChanged( "new", "single" ),
        ".hasChanged - Multiple properties check - one changed, one not (expect true)" )

    assert.equal( false, testMap.hasChanged( "single", "single2" ),
        ".hasChanged - Multiple properties check - none changed (expect false)" )

    testMap.set( {
        new: "im blue",
    } )

    assert.equal( false, testMap.hasChanged( "new" ),
        ".hasChanged - Updated prop with same value (expect false)" )

    assert.equal( undefined, testMap.delete( "new" ).get( "new" ),
        ".delete.get - Chain: detele existing -> get (expect undefined)" )

    assert.equal( true, testMap.delete( "update" ).hasChanged( "update" ),
        ".delete.hasChanged - Chain: delete existing -> hasChanged` (expect true)" )

    assert.end()
} )

