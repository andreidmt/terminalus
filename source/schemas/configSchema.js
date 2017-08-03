module.exports = {
    type    : "object",
    required: [ "commands", "layout" ],

    properties: {
        layout: {
            type : "array",
            items: {
                type : "array",
                items: {
                    type: "number",
                },
            },
        },
        name: {
            type: "string",
        },
        notify: {
            type   : "boolean",
            default: true,
        },
        commands: {
            type    : "array",
            minItems: 1,
            items   : {
                type                : "object",
                required            : [ "cmd" ],
                additionalProperties: false,
                properties          : {
                    label: {
                        type: "string",
                    },
                    cmd: {
                        type: "string",
                    },
                    args: {
                        type : "array",
                        items: {
                            type: "string",
                        },
                    },
                    stderr: {
                        type   : "boolean",
                        default: true,
                    },
                    clearOnRestart: {
                        type   : "boolean",
                        default: false,
                    },
                    watch: {
                        type      : "object",
                        properties: {
                            glob: {
                                type: "string",
                            },
                        },
                    },
                },
            },
        },
    },
}
