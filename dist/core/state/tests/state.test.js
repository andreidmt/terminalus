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
        lorem: "ipsum"
    });

    assert.equal("ipsum", testMap.get("lorem"), ".get - Get existing prop after init (expect string)");

    assert.equal(undefined, testMap.get("not-exist"), ".get - Get non-existing prop after init (expect undefined)");

    assert.equal(false, testMap.hasChanged("lorem"), ".hasChanged - Check prop after init (expect false)");

    assert.equal(false, testMap.hasChanged("not-exist"), ".hasChanged - Check non-existing prop (expect false)");

    testMap.set({
        lorem: "ipsum dolor",
        sit: "amen"
    });

    assert.equal("ipsum dolor", testMap.get("lorem"), ".get - Get updated prop");

    assert.equal(true, testMap.hasChanged("lorem"), ".hasChanged - Updated prop (expect true)");

    assert.equal(true, testMap.hasChanged("sit"), ".hasChanged - New prop (expect true)");

    testMap.set({
        lorem: "ipsum dolor"
    });

    assert.equal(false, testMap.hasChanged("lorem"), ".hasChanged - Updated prop with same value (expect false)");

    assert.equal(undefined, testMap.delete("lorem").get("lorem"), ".delete.get - Chain: detele existing -> get (expect undefined)");

    assert.equal(true, testMap.delete("sit").hasChanged("sit"), ".delete.hasChanged - Chain: delete existing -> hasChanged` (expect true)");

    assert.end();
});