'use strict';

import * as vscode from 'vscode';
import * as gitUtils from './lib/git-utils';
import * as vsUtils from './lib/vs-utils';
import { Repository } from './types/git';

export default { commandId: 'gitquickcheckout.checkoutAll', execute };

async function execute(): Promise<void> {
  const context = gitUtils.listRefNames();
  const quickPickItems = mapRefsToQuickPickItems(context);
  const placeHolder = 'Choose the ref to checkout in all workspace folders';
  const selectedItem = await vscode.window.showQuickPick(quickPickItems, { placeHolder });
  if (!selectedItem) {
    return;
  }

  const progressOptions = {
    location: vscode.ProgressLocation.Window,
    title: 'Checkout in progress...',
  };

  await vscode.window.withProgress(progressOptions, async () => {
    const refName = getRefNameFromQuickPickLabel(selectedItem);
    if (refName) {
      await gitUtils.checkoutRef(refName, context);
      vscode.window.setStatusBarMessage('Checkout done!', 3000);
    }
  });
}

// -----------------------------------------------------------------------------
// HELPERS: QUICKPICK
// -----------------------------------------------------------------------------

function mapRefsToQuickPickItems(context: gitUtils.GitContext): vscode.QuickPickItem[] {
  const defaultRefName = vsUtils.getOption('defaultBranchName');
  const items: vscode.QuickPickItem[] = [{ label: `$(heart) ${defaultRefName}` }];

  for (const refName of context.refNames) {
    const repos = context.refNamesMap.get(refName);
    const description = repos && describeRepos(repos);
    items.push({ label: `$(git-merge) ${refName}`, description });
  }

  return items;
}

function describeRepos(repos: Set<Repository>): string | undefined {
  const names = Array.from(repos).map(gitUtils.getRepoName).sort();
  return names.length > 0 ? '- ' + names.join(', ') : undefined;
}

function getRefNameFromQuickPickLabel(item: vscode.QuickPickItem): string | undefined {
  const match = item.label.match(/^\$\(.+?\) (.+)$/);
  return match ? match[1] : undefined;
}
