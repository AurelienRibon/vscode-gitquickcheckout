'use strict';

import simpleGit, { CheckRepoActions } from 'simple-git';
import * as vsUtils from './vs-utils';

export async function listBranchNames(paths: string[]): Promise<string[]> {
  const results = await parallelize(paths, listFolderBranchNames);
  const uniqueBranchNames = new Set(results.flat());
  return Array.from(uniqueBranchNames).sort();
}

export async function checkoutBranch(paths: string[], branchName: string): Promise<void> {
  await parallelize(paths, (path) => checkoutFolderBranch(path, branchName));
}

// -----------------------------------------------------------------------------
// GIT HELPERS
// -----------------------------------------------------------------------------

async function checkoutFolderBranch(path: string, branchName: string): Promise<void> {
  if (!(await isFolderAGitRoot(path))) {
    return;
  }

  if (!(await isBranchAvailableInFolder(path, branchName))) {
    const defaultBranchName = vsUtils.getConfiguration().defaultBranchName as string || 'master';
    if (branchName !== defaultBranchName) {
      await checkoutFolderBranch(path, defaultBranchName);
    }
    return;
  }

  try {
    await simpleGit().cwd(path).checkout(branchName);
  } catch (err) {
    console.error(`Failed to checkout branch in folder ${path}. ${err.message}`);
  }
}

async function listFolderBranchNames(path: string): Promise<string[]> {
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

  const branchNames: string[] = [];
  for (const branchName of res.all) {
    if (branchName.startsWith('remotes/origin/')) {
      branchNames.push(branchName.slice('remotes/origin/'.length));
    } else if (!branchName.startsWith('remotes/')) {
      branchNames.push(branchName);
    }
  }

  return branchNames;
}

async function isFolderAGitRoot(path: string): Promise<boolean> {
  try {
    return simpleGit().cwd(path).checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
  } catch (err) {
    console.error(`Failed to check if folder ${path} is a git repo. ${err.nessage}`);
    return false;
  }
}

async function isBranchAvailableInFolder(path: string, branchName: string): Promise<boolean> {
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

async function parallelize<T>(paths: string[], fn: (path: string) => Promise<T>): Promise<T[]> {
  const promises = paths.map(fn);
  return Promise.all(promises);
}
