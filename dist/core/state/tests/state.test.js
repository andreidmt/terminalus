"use strict";

var _tape = require("tape");

var _tape2 = _interopRequireDefault(_tape);

var _tapDiff = require("tap-diff");

var _tapDiff2 = _interopRequireDefault(_tapDiff);

var _state = require("../state");

var _state2 = _interopRequireDefault(_state);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import R from "ramda"

_tape2.default.createStream().pipe((0, _tapDiff2.default)()).pipe(process.stdout);

(0, _tape2.default)("### Immutable Map with history", assert => {

    const testMap = (0, _state2.default)({
        single: "leave me alone",
        single2: "leave me alone too",
        update: "paarty",
        boolean: true
    });

    /**/
    /**/assert.comment(".get( key: string ): * | undefined");
    /**/

    assert.equal("leave me alone", testMap.get("single"), "Existing prop after init");

    assert.equal(undefined, testMap.get("not-exist"), "Non-existing prop after init");

    assert.equal(true, testMap.get("boolean"), "Boolean prop after init");

    /**/
    /**/assert.comment(".set( object <string, *> )");
    /**/

    testMap.set({
        boolean: !testMap.get("boolean"),
        update: "ooh yeah",
        new: "im blue",
        newCallback: "ooh yeah2"
    });

    assert.equal(false, testMap.get("boolean"), "Boolean prop after toggle - Map.set( { x: !Map.get( x ) } )");

    assert.equal("ooh yeah", testMap.get("update"), "Update prop");

    /**/
    /**/assert.comment(".hasChanged( key: string ): boolean");
    /**/

    assert.equal(true, testMap.hasChanged("new"), "New prop");

    assert.equal(true, testMap.hasChanged("update"), "Updated prop");

    assert.equal(false, testMap.hasChanged("single"), "Prop after init");

    assert.equal(false, testMap.hasChanged("not-exist"), "Non-existing prop");

    assert.equal(true, testMap.hasChanged("new", "single"), "Multiple properties (one changed)");

    assert.equal(false, testMap.hasChanged("single", "single2"), "Multiple properties (none changed)");

    assert.equal(true, testMap.hasChanged("boolean", "update"), "Multiple properties (all changed)");

    testMap.set({
        new: "im blue"
    });

    assert.equal(false, testMap.hasChanged("new"), "Updated prop with same value");

    assert.end();
});