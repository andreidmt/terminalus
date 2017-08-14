"use strict";

module.exports = {

    //
    align: "right",

    //
    bold: true,

    // default value "@"
    format: "[ @ ]",

    // events that trigger main function
    subscribe: ["child:status", "child:spawn"],

    meta(frame, status, spawn) {
        return this.format.replace("@", "lorem");
    }
};