"use strict";

module.exports = {
    type: "object",
    required: ["frames", "layout"],

    properties: {
        layout: {
            oneOf: [{
                type: "array",
                items: {
                    type: "array",
                    items: {
                        type: "string"
                    }
                }
            }]
        },
        name: {
            type: "string"
        },
        notify: {
            type: "boolean",
            default: true
        },
        frames: {
            type: "object",
            minItems: 1,
            items: {
                $ref: "#/definitions/frame"
            }
        }
    },

    definitions: {
        frame: {
            type: "object",
            required: ["cmd"],

            additionalProperties: false,
            properties: {
                label: {
                    type: "string"
                },
                cmd: {
                    type: "string"
                },
                args: {
                    type: "array",
                    items: {
                        type: "string"
                    }
                },
                stderr: {
                    type: "boolean",
                    default: true
                },
                clearOnRestart: {
                    type: "boolean",
                    default: false
                },
                watch: {
                    type: "object",
                    properties: {
                        glob: {
                            type: "string"
                        }
                    }
                }
            }
        },
        layoutRow: {
            type: "array",
            items: {
                oneOf: [{ $ref: "#/definitions/layoutCommand" }, { $ref: "#/definitions/layoutRow" }]
            }
        },
        layoutCommand: {
            oneOf: [{
                type: "integer"
            }, {
                type: "object",
                required: ["alias"],

                additionalProperties: false,
                properties: {
                    alias: {
                        type: "string"
                    },
                    width: {
                        oneOf: [{
                            type: "integer"
                        }, {
                            type: "string",
                            pattern: "^.*%$"
                        }]
                    }
                }
            }]
        }
    }
};