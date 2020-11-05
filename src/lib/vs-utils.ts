'use strict';

import * as vscode from 'vscode';

export function getWorkspaceFoldersPaths(): string[] | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.map((it) => it.uri.fsPath);
}

export function getOption(name: 'defaultBranchName'): string;
export function getOption(name: unknown): unknown {
  const config = vscode.workspace.getConfiguration('gitquickcheckout');
  switch (name) {
    case 'defaultBranchName':
      return config[name] as string;
  }
}
