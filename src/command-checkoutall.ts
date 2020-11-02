'use strict';

import * as vscode from 'vscode';
import * as vsUtils from './lib/vs-utils';
import * as gitUtils from './lib/git-utils';

export default { commandId: 'gitquickcheckout.checkoutAll', execute };

async function execute(): Promise<void> {
  const folderPaths = vsUtils.getWorkspaceFoldersPaths();
  if (!folderPaths) {
    vsUtils.showBriefStatusBarMessage('Sorry, workspace has no folder(s) to checkout.');
    return;
  }

  const gitContext = await gitUtils.listBranchNames(folderPaths);
  const selectedBranchName = await vscode.window.showQuickPick(gitContext.branchNames, {
    placeHolder: 'Choose the branch to checkout in all worspace folders',
  });

  if (selectedBranchName) {
    await gitUtils.checkoutBranch(selectedBranchName, gitContext);
    vsUtils.showBriefStatusBarMessage(`Workspace folders switched to ${selectedBranchName}.`);
  }
}
