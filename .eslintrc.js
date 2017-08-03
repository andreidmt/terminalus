/* eslint-env node */

module.exports = {
    root    : true,
    parser  : "babel-eslint",
    extends : [ "@codemachiner/eslint-config/rules/backend" ],
    settings: {
        "import/resolver": "node",
    },
    rules: {
        "valid-jsdoc"          : "off",
        "no-unused-expressions": "off",
        "import/no-unresolved" : [ 2, { commonjs: true } ],
    },
}
