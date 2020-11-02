'use strict';

import simpleGit, { CheckRepoActions } from 'simple-git';
import * as vsUtils from './vs-utils';

interface GitContext {
  paths: string[];
  branchNames: string[];
  branchNamesMap: Map<string, string[]>;
}

export async function listBranchNames(paths: string[]): Promise<GitContext> {
  const branchNamesPerRepo = await parallelize(paths, listFolderBranchNames);
  const uniqueBranchNames = new Set(branchNamesPerRepo.flat());

  return {
    paths,
    branchNames: Array.from(uniqueBranchNames).sort(),
    branchNamesMap: new Map(paths.map((it, i) => [it, branchNamesPerRepo[i]])),
  };
}

export async function checkoutBranch(branchName: string, context: GitContext): Promise<void> {
  await parallelize(context.paths, (path) => checkoutFolderBranch(path, branchName, context));
}

// -----------------------------------------------------------------------------
// GIT HELPERS
// -----------------------------------------------------------------------------

async function checkoutFolderBranch(path: string, branchName: string, context: GitContext): Promise<void> {
  if (!isBranchAvailableInFolder(path, branchName, context)) {
    const defaultBranchName = (vsUtils.getConfiguration().defaultBranchName as string) || 'master';
    if (branchName !== defaultBranchName) {
      await checkoutFolderBranch(path, defaultBranchName, context);
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

// -----------------------------------------------------------------------------
// MISC HELPERS
// -----------------------------------------------------------------------------

async function parallelize<T>(paths: string[], fn: (path: string) => Promise<T>): Promise<T[]> {
  const promises = paths.map(fn);
  return Promise.all(promises);
}

function isBranchAvailableInFolder(path: string, branchName: string, context: GitContext): boolean {
  const branchNames = context.branchNamesMap.get(path);
  return branchNames ? branchNames.includes(branchName) : false;
}
