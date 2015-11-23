'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');

const win32 = process.platform === 'win32';

const defaultExtensionMap = {
  coffee: "coffee"
}

const defaultLanguageMap = {
  bat: "",
  clojure: "clj",
  go: "go run",
  javascript: "node",
  lua: "lua",
  perl6: "perl6",
  perl: "perl",
  php: "php",
  powershell: "powershell -noninteractive -noprofile -c -",
  python: "python",
  ruby: "ruby",
  shell: "bash",
  typescript: "tsc"
};

function getActionFromFileName(fileName: string): string {
  if (!fileName) return null;
  var extensionMap = {};
  var userExtensionMap = vscode.workspace.getConfiguration('runner')['extensionMap'] || {};
  for (var key in defaultExtensionMap) { extensionMap[key] = defaultExtensionMap[key]; }
  for (var key in userExtensionMap) { extensionMap[key] = userExtensionMap[key]; }
  var ids = Object.keys(extensionMap).sort();
  for (var id in ids) {
    var ext = ids[id];
    if (fileName.match((ext.match(/^\b/) ? '' : '\\b') + ext + '$')) {
      return extensionMap[ext];
    }
  }
  return null;
}

function getActionFromShebang(): string {
  var ignoreShebang = vscode.workspace.getConfiguration('runner')['ignoreShebang'] || false;
  if (ignoreShebang) return null;
  var firstLine = vscode.window.activeTextEditor.document.lineAt(0).text;
  if (firstLine.match(/^#!(.*)/)) {
    return RegExp.$1;
  }
  return null;
}

function getActionFromLanguageId(languageId: string): string {
  var languageMap = {};
  var userLanguageMap = vscode.workspace.getConfiguration('runner')['languageMap'] || {};
  for (var key in defaultLanguageMap) { languageMap[key] = defaultLanguageMap[key]; }
  for (var key in userLanguageMap) { languageMap[key] = userLanguageMap[key]; }
  return languageMap[languageId];
}

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(vscode.commands.registerCommand('extension.runner', () => {
    var document = vscode.window.activeTextEditor.document;
    var fileName = document.fileName;
    var languageId = document.languageId;

    var action = getActionFromShebang();
    if (action == null) action = getActionFromLanguageId(languageId);
    if (action == null) action = getActionFromFileName(fileName);
    if (action == null) {
      vscode.window.showErrorMessage('Not found action for ' + languageId);
      return;
    }
    var cwd = vscode.workspace.rootPath;
    fileName = path.relative(cwd, fileName);
    var output = vscode.window.createOutputChannel('Runner: ' + action + ' ' + fileName);
    output.show();
    var sh = win32 ? 'cmd' : '/bin/sh';
    var shflag = win32 ? '/c' : '-c';
    var args = document.isDirty || document.isUntitled ? [shflag, action] : [shflag, action + ' ' + fileName];
    var child = cp.spawn(sh, args, { cwd: cwd, detached: false });
    child.stderr.on('data', (data) => {
      output.append(data.toString());
    });
    child.stdout.on('data', (data) => {
      output.append(data.toString());
    });
    child.on('close', (code, signal) => {
      if (signal)
        output.append('Exited with signal ' + signal)
      else if (code)
        output.append('Exited with status ' + code)
    });
    if (document.isDirty || document.isUntitled) {
      child.stdin.write(document.getText());
    }
    child.stdin.end();
  }));
}
