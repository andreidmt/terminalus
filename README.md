# WIP: Terminalus

> npm terminal dashboard

![Terminalus](https://raw.githubusercontent.com/codemachiner/npm-teminalus/master/docs/terminal.png)

---

<!-- MarkdownTOC depth=2 autolink=true indent="    " -->

- [About](#about)
- [Commands](#commands)
- [Frames](#frames)
- [Layout](#layout)
- [Watch](#watch)
    - [Dependencies](#dependencies)
- [Notifications](#notifications)
- [Example `.terminalusrc`](#example-terminalusrc)
- [Reading](#reading)

<!-- /MarkdownTOC -->

## About

Custom dev dashboard with watch, notify and process dependency

## Commands

```json
"frames": {
    "eslint": {
        "label": "ESLint",
        "cmd": "npm",
        "args": [ "run", "lint", "--", "--color" ],
        "stderr": false,
        "watch":  "source/**/*.js"
    },
    "flow": {
        "label": "Flow",
        "cmd": "npm",
        "args": [ "run", "flow", "--", "--color=always" ],
        "stderr": false,
        "clearOnRestart": true
    }
}
```

## Frames

TODO:

- autofocus last error
- toggle fullscreen
- options menu
- custom meta info support - info to be displayed in the frame title or footer
- custom formatters

## Layout

HTML table `tr` / `td` like config with auto sizing.

```json
"layout": {
    "td:70": {
        "tr:50": [ "tape", "flow" ],
        "tr": [ "eslint" ]
    },
    "td": [ "debug", "babel" ]
}
```

## Watch

### Dependencies

## Notifications

## Example `.terminalusrc`

```json
{
    "name"  : "npm terminal dashboard",
    "frames": {
        "eslint": {
            "label": "ESLint",
            "cmd": "npm",
            "args": [ "run", "lint", "--", "--color" ],
            "stderr": false,
            "watch":  "source/**/*.js"
        },
        "flow": {
            "label": "Flow",
            "cmd": "npm",
            "args": [ "run", "flow", "--", "--color=always" ],
            "stderr": false,
            "clearOnRestart": true
        },
        "tape": {
            "label": "Tape",
            "cmd": "npm",
            "args": [ "run", "test", "--", "--color" ],
            "stderr": false,
            "clearOnRestart": true,
            "meta": [ "status" ]
        },
        "babel": {
            "label": "Babel",
            "cmd": "npm",
            "args": [ "run", "build", "--", "--color" ]
        },
        "debug": {
            "label": "Node inspect",
            "cmd": "node",
            "args": [ "--inspect-brk", "source/test.js" ]
        }
    },
    "layout": {
        "td:70": {
            "tr:50": [ "tape", "flow" ],
            "tr": [ "eslint" ]
        },
        "td": [ "debug", "babel" ]
    }
}
```

## Reading

- [Cycle.js Fundamentals - egghead.io](https://egghead.io/courses/cycle-js-fundamentals)
- [JSON Schema](http://json-schema.org/) & [Ajv: Another JSON Schema Validator](https://github.com/epoberezkin/ajv)
- [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
