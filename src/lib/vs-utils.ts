'use strict';

import * as vscode from 'vscode';

export function getWorkspaceFoldersPaths(): string[] | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.map((it) => it.uri.fsPath);
}

export function getDefaultRefName(): string {
  const config = vscode.workspace.getConfiguration('gitquickcheckout');
  return (config.defaultBranchName as string) || 'master';
}
