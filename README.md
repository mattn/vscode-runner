# Runner

Run various scripts.

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
  }
}
```

## License

MIT

## Author

Yasuhiro Matsumoto (a.k.a mattn)
