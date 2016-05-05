'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');

const win32 = process.platform === 'win32';

const defaultExtensionMap = {
  coffee: 'coffee'
}

const defaultLanguageMap = {
  bat: '',
  clojure: 'clj',
  go: 'go run',
  javascript: 'node',
  lua: 'lua',
  perl6: 'perl6',
  perl: 'perl',
  php: 'php',
  powershell: 'powershell -noninteractive -noprofile -c -',
  python: 'python',
  r: 'Rscript',
  ruby: 'ruby',
  shell: 'bash',
  typescript: 'tsc'
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
  if (firstLine.match(/^#!\s*(.*)\s*$/)) {
    var cmd = RegExp.$1;
    var shebangMap = vscode.workspace.getConfiguration('runner')['shebangMap'] || {};
    for (var key in shebangMap) {
      try {
        if (new RegExp(key).test(firstLine)) return shebangMap[key];
      } catch(e) { }
    }
    return cmd;
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
  var currentProcess : cp.ChildProcess;

  ctx.subscriptions.push(vscode.commands.registerCommand('extension.runner.stop', () => {
    if (currentProcess != null) {
      if (win32)
        cp.spawn('taskkill', ['/pid', currentProcess.pid.toString(), '/f', '/t']);
      else
        currentProcess.kill('SIGINT');
    }
  }));
  ctx.subscriptions.push(vscode.commands.registerCommand('extension.runner.start', () => {
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
    if(cwd != null)
      fileName = path.relative(cwd, fileName);
    fileName = win32 ? fileName : fileName.replace(/ /g, '\\ ');
    var output = vscode.window.createOutputChannel('Runner: ' + action + ' ' + fileName);
    output.show(vscode.ViewColumn.Two);
    setTimeout(() => {
      vscode.window.showTextDocument(document)
    },50)
    // TODO parse line and spawn command without shells. because it's not
    // possible to get an error code of execute on windows.
    var sh = win32 ? 'cmd' : '/bin/sh';
    var fromInput = document.isDirty || document.isUntitled;
    var args = win32 ?
      (fromInput ? ['/s', '/c', action] : ['/s', '/c', action + ' ' + '\"' + fileName + '\"'])
    :
      (fromInput ? ['-c', action] : ['-c', action + ' ' + '\"' + fileName + '\"']);
    var opts = { cwd: cwd, detached: false };
    if (win32) opts['windowsVerbatimArguments'] = true;
    var child = cp.spawn(sh, args, opts);
    currentProcess = child;

    var clearPreviousOutput = vscode.workspace.getConfiguration('runner')['clearPreviousOutput'] && true;
    if(clearPreviousOutput)
      output.clear()
    child.stderr.on('data', (data) => {
      output.append(data.toString());
    });
    child.stdout.on('data', (data) => {
      output.append(data.toString());
    });
    child.on('close', (code, signal) => {
      if (signal)
        output.appendLine('Exited with signal ' + signal)
      else if (code)
        output.appendLine('Exited with status ' + code)
      currentProcess = null;
    });
    if (fromInput) {
      child.stdin.write(document.getText());
    }
    child.stdin.end();
  }));
}
