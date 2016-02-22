# Runner

Run various scripts.

![](https://raw.githubusercontent.com/mattn/vscode-runner/master/images/screenshot.gif)

## Usage

Type CTRL-SHIFT-R on script files.

## Configuration

Add entry into `runner.languageMap`, keys should be known type on Visual Studio Code.
`runner.extensionMap` matches end of the name of file.

```json
{
  "runner.languageMap": {
    "foo": "/usr/bin/bar"
  },
  "runner.extensionMap": {
    "foo": "/usr/bin/bar"
  },
  "runner.shebangMap": {
    "^#!\\s*/usr/bin/python2": "python",
    "^#!\\s*/usr/bin/env python": "python",
    "^#!\\s*/usr/bin/python3": "python3",
    "^#!\\s*/usr/bin/env python3": "python3"
  }
}
```

If want to clear previous output, set `"runner.clearPreviousOutput": true`.
want to ignore shebang line, set "runner.ignoreShebang": true`.

Type CTRL-SHIFT-T to stop the process.

## License

MIT

## Author

Yasuhiro Matsumoto (a.k.a mattn)
