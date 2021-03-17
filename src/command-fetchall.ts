'use strict';

import * as vscode from 'vscode';
import * as gitUtils from './lib/git-utils';

export default { commandId: 'gitquickcheckout.fetchAll', execute };

async function execute(): Promise<void> {
  const context = gitUtils.listRefNames();

  const progressOptions = {
    location: vscode.ProgressLocation.Window,
    title: 'Fetch in progress...',
  };

  await vscode.window.withProgress(progressOptions, async () => {
    await gitUtils.fetchRepos(context);
    vscode.window.setStatusBarMessage('Fetch done!', 3000);
  });
}
