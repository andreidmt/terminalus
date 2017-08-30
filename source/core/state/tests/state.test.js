import test from "tape"
import tapDiff from "tap-diff"
import stateHistoryFactory from "../state"

// import R from "ramda"

test.createStream()
    .pipe( tapDiff() )
    .pipe( process.stdout )


test( "### Immutable Map with history", assert => {

    const testMap = stateHistoryFactory( {
        single : "leave me alone",
        single2: "leave me alone too",
        update : "paarty",
        boolean: true,
    } )

    /**/
    /**/ assert.comment( ".get( key: string ): * | undefined" )
    /**/

    assert.equal( "leave me alone", testMap.get( "single" ),
        "Existing prop after init" )

    assert.equal( undefined, testMap.get( "not-exist" ),
        "Non-existing prop after init" )

    assert.equal( true, testMap.get( "boolean" ),
        "Boolean prop after init" )

    /**/
    /**/ assert.comment( ".set( object <string, *> )" )
    /**/

    testMap.set( {
        boolean    : !testMap.get( "boolean" ),
        update     : "ooh yeah",
        new        : "im blue",
        newCallback: "ooh yeah2",
    } )

    assert.equal( false, testMap.get( "boolean" ),
        "Boolean prop after toggle - Map.set( { x: !Map.get( x ) } )" )

    assert.equal( "ooh yeah", testMap.get( "update" ),
        "Update prop" )

    /**/
    /**/ assert.comment( ".hasChanged( key: string ): boolean" )
    /**/

    assert.equal( true, testMap.hasChanged( "new" ),
        "New prop" )

    assert.equal( true, testMap.hasChanged( "update" ),
        "Updated prop" )

    assert.equal( false, testMap.hasChanged( "single" ),
        "Prop after init" )

    assert.equal( false, testMap.hasChanged( "not-exist" ),
        "Non-existing prop" )

    assert.equal( true, testMap.hasChanged( "new", "single" ),
        "Multiple properties (one changed)" )

    assert.equal( false, testMap.hasChanged( "single", "single2" ),
        "Multiple properties (none changed)" )

    assert.equal( true, testMap.hasChanged( "boolean", "update" ),
        "Multiple properties (all changed)" )

    testMap.set( {
        new: "im blue",
    } )

    assert.equal( false, testMap.hasChanged( "new" ),
        "Updated prop with same value" )

    assert.end()
} )
