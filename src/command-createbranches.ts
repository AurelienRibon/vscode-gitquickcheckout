'use strict';

import * as vscode from 'vscode';
import * as gitUtils from './lib/git-utils';
import * as vsUtils from './lib/vs-utils';

export default { commandId: 'gitquickcheckout.createBranches', execute };

async function execute(): Promise<void> {
  const context = await gitUtils.listRefNames();

  const prompt = 'What should be the new branch name?';
  const branchNameProposal = guessNewBranchName(context);
  const branchName = await vscode.window.showInputBox({ prompt, value: branchNameProposal });
  if (!branchName) {
    return;
  }

  const quickPickItems = mapReposToQuickPickItems(context, branchName);
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
// HELPERS: INITIAL NAME
// -----------------------------------------------------------------------------

function guessNewBranchName(context: gitUtils.GitContext): string {
  const defaultRefNames = vsUtils.getOption('defaultBranchNames');
  const defaultRefNamesSet = new Set(defaultRefNames);

  for (const repo of context.repos) {
    if (repo.state.HEAD?.name && !defaultRefNamesSet.has(repo.state.HEAD.name)) {
      return repo.state.HEAD.name;
    }
  }

  return '';
}

// -----------------------------------------------------------------------------
// HELPERS: QUICKPICK
// -----------------------------------------------------------------------------

function mapReposToQuickPickItems(context: gitUtils.GitContext, branchName: string): vscode.QuickPickItem[] {
  const items: vscode.QuickPickItem[] = [];

  for (const repo of context.repos) {
    const hasChanges = repo.state.workingTreeChanges.length > 0;
    const hasBranch = context.refNamesMap.get(branchName)?.has(repo);

    items.push({
      label: `$(repo) ${gitUtils.getRepoName(repo)}`,
      picked: hasChanges && !hasBranch,
    });
  }

  return items;
}

function getRepoNameFromQuickPickLabel(item: vscode.QuickPickItem): string | undefined {
  const match = item.label.match(/^\$\(.+?\) (.+)$/);
  return match ? match[1] : undefined;
}
