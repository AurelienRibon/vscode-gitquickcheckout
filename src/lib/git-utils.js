'use strict';

const simpleGit = require('simple-git');
const vsUtils = require('./vs-utils');

exports.listBranchNames = async function (paths) {
  const results = await parallelize(paths, listFolderBranchNames);
  const uniqueBranchNames = new Set(results.flat());
  return Array.from(uniqueBranchNames).sort();
};

exports.checkoutBranch = async function (paths, branchName) {
  return parallelize(paths, (path) => checkoutFolderBranch(path, branchName));
};

// -----------------------------------------------------------------------------
// GIT HELPERS
// -----------------------------------------------------------------------------

async function checkoutFolderBranch(path, branchName) {
  if (!(await isFolderAGitRoot(path))) {
    return;
  }

  if (!(await isBranchAvailableInFolder(path, branchName))) {
    const { defaultBranchName } = vsUtils.getConfiguration();
    if (branchName !== defaultBranchName) {
      return checkoutFolderBranch(path, 'master');
    } else {
      return;
    }
  }

  try {
    await simpleGit().cwd(path).checkout(branchName);
  } catch (err) {
    console.error(`Failed to checkout branch in folder ${path}. ${err.message}`);
  }
}

async function listFolderBranchNames(path) {
  if (!(await isFolderAGitRoot(path))) {
    return [];
  }

  let res;

  try {
    res = await simpleGit().cwd(path).branch();
  } catch (err) {
    console.error(`Failed list branches in folder ${path}. ${err.message}`);
    return [];
  }

  const branchNames = [];
  for (const branchName of res.all) {
    if (branchName.startsWith('remotes/origin/')) {
      branchNames.push(branchName.slice('remotes/origin/'.length));
    } else if (!branchName.startsWith('remotes/')) {
      branchNames.push(branchName);
    }
  }

  return branchNames;
}

async function isFolderAGitRoot(path) {
  try {
    return simpleGit().cwd(path).checkIsRepo('root');
  } catch (err) {
    console.error(`Failed to check if folder ${path} is a git repo. ${err.nessage}`);
    return false;
  }
}

async function isBranchAvailableInFolder(path, branchName) {
  try {
    const res = await simpleGit().cwd(path).branch(['--list', branchName]);
    return res.all.length > 0;
  } catch (err) {
    console.error(`Failed to check if branch is available in folder ${path}. ${err.nessage}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// MISC HELPERS
// -----------------------------------------------------------------------------

async function parallelize(paths, fn) {
  const promises = paths.map(fn);
  return Promise.all(promises);
}
