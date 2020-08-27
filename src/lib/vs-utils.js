'use strict';

const vscode = require('vscode');

exports.getWorkspaceFoldersPaths = function () {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.map((it) => it.uri.fsPath);
};

exports.getConfiguration = function () {
  return vscode.workspace.getConfiguration('gitquickcheckout');
};

exports.showBriefStatusBarMessage = function (msg) {
  vscode.window.setStatusBarMessage(msg, 2000);
};
