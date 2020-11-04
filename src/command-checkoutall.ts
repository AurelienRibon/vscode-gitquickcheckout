'use strict';

import * as vscode from 'vscode';
import * as vsUtils from './lib/vs-utils';
import * as gitUtils from './lib/git-utils';

export default { commandId: 'gitquickcheckout.checkoutAll', execute };

async function execute(): Promise<void> {
  const gitContext = gitUtils.listRefNames();
  const selectedRefName = await vscode.window.showQuickPick(gitContext.refNames, {
    placeHolder: 'Choose the ref to checkout in all workspace folders',
  });

  if (selectedRefName) {
    await gitUtils.checkoutRef(selectedRefName, gitContext);
    vsUtils.showBriefStatusBarMessage(`Workspace folders switched to ${selectedRefName}.`);
  }
}
