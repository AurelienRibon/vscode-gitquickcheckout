'use strict';

import * as vscode from 'vscode';

export function getWorkspaceFoldersPaths(): string[] | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.map((it) => it.uri.fsPath);
}

export function getOption(name: 'defaultBranchNames'): string[];
export function getOption(name: unknown): unknown {
  const config = vscode.workspace.getConfiguration('gitquickcheckout');
  switch (name) {
    case 'defaultBranchNames':
      return config[name] as string[];
  }
}
