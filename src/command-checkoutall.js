'use strict';

const vscode = require('vscode');
const vsUtils = require('./lib/vs-utils');
const gitUtils = require('./lib/git-utils');

exports.commandId = 'gitquickcheckout.checkoutAll';

exports.execute = async function () {
  const folderPaths = vsUtils.getWorkspaceFoldersPaths();
  if (!folderPaths) {
    vsUtils.showBriefStatusBarMessage('Sorry, workspace has no folder(s) to checkout.');
  }

  const possibleBranchNames = await gitUtils.listBranchNames(folderPaths);
  const selectedBranchName = await vscode.window.showQuickPick(possibleBranchNames, {
    placeHolder: 'Choose the branch to checkout in all worspace folders',
  });

  if (selectedBranchName) {
    await gitUtils.checkoutBranch(folderPaths, selectedBranchName);
    vsUtils.showBriefStatusBarMessage(`Workspace folders switched to ${selectedBranchName}.`);
  }
};
