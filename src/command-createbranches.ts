'use strict';

import * as vscode from 'vscode';
import * as gitUtils from './lib/git-utils';

export default { commandId: 'gitquickcheckout.createBranches', execute };

async function execute(): Promise<void> {
  const context = gitUtils.listRefNames();

  const prompt = 'What should be the new branch name?';
  const branchName = await vscode.window.showInputBox({ prompt })
  if (!branchName) {
    return;
  }

  const quickPickItems = mapReposToQuickPickItems(context);
  const placeHolder = 'Choose the repositories for the new branch.';
  const selectedItems = await vscode.window.showQuickPick(quickPickItems, { placeHolder, canPickMany: true });
  if (!selectedItems) {
    return;
  }

  const progressOptions = {
    location: vscode.ProgressLocation.Window,
    title: 'Branch creation in progress...',
  };

  await vscode.window.withProgress(progressOptions, async () => {
    const reposNames = selectedItems.map(getRepoNameFromQuickPickLabel).filter((it) => !!it) as string[];
    await gitUtils.createBranches(reposNames, branchName, context);
    vscode.window.setStatusBarMessage('Branch creation done!', 3000);
  });
}

// -----------------------------------------------------------------------------
// HELPERS: QUICKPICK
// -----------------------------------------------------------------------------

function mapReposToQuickPickItems(context: gitUtils.GitContext): vscode.QuickPickItem[] {
  const items: vscode.QuickPickItem[] = [];

  for (const repo of context.repos) {
    items.push({ label: `$(repo) ${gitUtils.getRepoName(repo)}` });
  }

  return items;
}

function getRepoNameFromQuickPickLabel(item: vscode.QuickPickItem): string | undefined {
  const match = item.label.match(/^\$\(.+?\) (.+)$/);
  return match ? match[1] : undefined;
}
