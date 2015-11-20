'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');

const win32 = process.platform === 'win32';

const defaultLanguageMap = {
  go: "go run",
  perl: "perl",
  perl6: "perl6",
  ruby: "ruby",
  python: "python",
  php: "php",
  coffee: "coffee",
  shell: "bash",
  typescript: "tsc",
  powershell: "powershell -noninteractive -noprofile -c -"
};

function getActionFor(fileName: string) {
  if (!fileName) return;
  var extensionMap = vscode.workspace.getConfiguration('runner')['extensionMap'];
  var ids = Object.keys(extensionMap).sort();
  for (var id in ids) {
    var ext = ids[id];
    if (fileName.match(ext.match(/^\b/) ? '' : '\\b' + ext + '$')) {
      return extensionMap[ext];
    }
  }
  return null;
}

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(vscode.commands.registerCommand('extension.runner', () => {
    var fileName = vscode.window.activeTextEditor.document.fileName;
    var languageId = vscode.window.activeTextEditor.document.languageId;
    var action = defaultLanguageMap[languageId];
	if (!action) action = getActionFor(fileName);
    if (!action) return;
    fileName = path.relative(".", fileName);
    var output = vscode.window.createOutputChannel('Runner: ' + action + ' ' + fileName);
    output.show();
    var sh = win32 ? 'cmd' : 'sh';
    var shflag = win32 ? '/c' : '-c';
    cp.execFile(sh, [shflag, action + ' ' + fileName], {}, (err, stdout, stderr) => {
      output.append(stdout.toString());
      output.append(stderr.toString());
    });
  }));
}
