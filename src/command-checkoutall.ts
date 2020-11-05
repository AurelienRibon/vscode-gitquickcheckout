'use strict';

import * as vscode from 'vscode';
import * as gitUtils from './lib/git-utils';
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

  vscode.window.withProgress(progressOptions, async () => {
    await gitUtils.checkoutRef(selectedItem.label, context);
    vscode.window.setStatusBarMessage('Checkout done!', 3000);
  });
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function mapRefsToQuickPickItems(context: gitUtils.GitContext): vscode.QuickPickItem[] {
  const items: vscode.QuickPickItem[] = [];
  for (const refName of context.refNames) {
    const repos = context.refNamesMap.get(refName);
    const description = repos && describeRepos(repos);
    items.push({ label: refName, description });
  }

  return items;
}

function describeRepos(repos: Set<Repository>): string | undefined {
  const names = Array.from(repos).map(getRepoName).sort();
  return names.length > 0 ? '- ' + names.join(', ') : undefined;
}

function getRepoName(repo: Repository): string {
  const { path } = repo.rootUri;
  const lastSepIndex = path.lastIndexOf('/');
  return lastSepIndex === -1 ? path : path.slice(lastSepIndex + 1);
}
