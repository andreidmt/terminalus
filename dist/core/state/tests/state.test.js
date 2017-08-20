"use strict";

var _tape = require("tape");

var _tape2 = _interopRequireDefault(_tape);

var _tapDiff = require("tap-diff");

var _tapDiff2 = _interopRequireDefault(_tapDiff);

var _state = require("../state");

var _state2 = _interopRequireDefault(_state);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_tape2.default.createStream().pipe((0, _tapDiff2.default)()).pipe(process.stdout);

(0, _tape2.default)("Immutable Map with history", assert => {

    const testMap = (0, _state2.default)({
        single: "leave me alone",
        update: "paarty",
        boolean: true
    });

    assert.equal("leave me alone", testMap.get("single"), ".get - Get existing prop after init (expect string)");

    assert.equal(undefined, testMap.get("not-exist"), ".get - Get non-existing prop after init (expect undefined)");

    assert.equal(true, testMap.get("boolean"), ".get - Get boolean prop after init (expect true)");

    //
    //
    testMap.set({
        boolean: !testMap.get("boolean"),
        update: "ooh yeah",
        new: "im blue"
    });

    assert.equal(false, testMap.get("boolean"), ".set,.get - Get boolean prop after toggle (expect false)");

    assert.equal("ooh yeah", testMap.get("update"), ".set,.get - Get updated prop");

    assert.equal(false, testMap.hasChanged("single"), ".hasChanged - Check prop after init (expect false)");

    assert.equal(false, testMap.hasChanged("not-exist"), ".hasChanged - Check non-existing prop (expect false)");

    assert.equal(true, testMap.hasChanged("update"), ".hasChanged - Updated prop (expect true)");

    assert.equal(true, testMap.hasChanged("new"), ".hasChanged - New prop (expect true)");

    testMap.set({
        new: "im blue"
    });

    assert.equal(false, testMap.hasChanged("new"), ".hasChanged - Updated prop with same value (expect false)");

    assert.equal(undefined, testMap.delete("new").get("new"), ".delete.get - Chain: detele existing -> get (expect undefined)");

    assert.equal(true, testMap.delete("update").hasChanged("update"), ".delete.hasChanged - Chain: delete existing -> hasChanged` (expect true)");

    assert.end();
});