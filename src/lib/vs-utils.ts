'use strict';

import * as vscode from 'vscode';

export function getWorkspaceFoldersPaths(): string[] | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.map((it) => it.uri.fsPath);
}

export function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('gitquickcheckout');
}

export function showBriefStatusBarMessage(msg: string): void {
  vscode.window.setStatusBarMessage(msg, 3000);
}
