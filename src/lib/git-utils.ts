'use strict';

import * as vscode from 'vscode';
import * as vsUtils from './vs-utils';
import { GitExtension, Ref, RefType, Repository } from '../types/git';

type RefMap = Map<string, Ref>;

interface GitContext {
  refNames: string[];
  refNamesTree: Map<string, RefMap>;
}

export function listRefNames(): GitContext {
  const repos = getRepos();
  const refNamesMaps = repos.map(mapRepoRefNames);
  const refNames = extractUniqueRefNames(refNamesMaps);
  const refNamesTree = new Map(repos.map(getRepoPath).map((it, i) => [it, refNamesMaps[i]]));
  return { refNames, refNamesTree };
}

export async function checkoutRef(refName: string, context: GitContext): Promise<void> {
  const repos = getRepos();
  await parallelize(repos, (repo) => checkoutRepoRef(repo, refName, context));
}

// -----------------------------------------------------------------------------
// HELPERS: GIT MUTATIONS
// -----------------------------------------------------------------------------

async function checkoutRepoRef(repo: Repository, refName: string, context: GitContext): Promise<void> {
  const path = getRepoPath(repo);
  const ref = context.refNamesTree.get(path)?.get(refName);
  const defaultRefName = getDefaultRefName();

  if (repo.state.HEAD?.name === ref?.name) {
    return;
  }

  console.log(repo.rootUri.fsPath, refName, ref);

  if (!ref) {
    if (refName !== defaultRefName) {
      await checkoutRepoRef(repo, defaultRefName, context);
    }
    return;
  }

  try {
    await repo.checkout(refName);
  } catch (err) {
    console.error(`Failed to checkout ref in folder ${path}. ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// HELPERS: GIT ACCESS
// -----------------------------------------------------------------------------

function getRepos(): Repository[] {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
  const api = gitExtension?.getAPI(1);
  return api ? api.repositories : [];
}

function getRepoPath(repo: Repository): string {
  return repo.rootUri.fsPath;
}

function getDefaultRefName(): string {
  return (vsUtils.getConfiguration().defaultBranchName as string) || 'master';
}

// -----------------------------------------------------------------------------
// HELPERS: REF MAPPING
// -----------------------------------------------------------------------------

function mapRepoRefNames(repo: Repository): RefMap {
  const map: RefMap = new Map();

  for (const ref of repo.state.refs) {
    const simpleRefName = simplifyRefName(ref);

    // If the ref does not interest us, carry on.
    if (!simpleRefName) {
      continue;
    }

    // If we already saw this ref, we let it be overridden if the new ref is a
    // local one. It's an opinionated choice.
    if (ref.type !== RefType.Head && map.has(simpleRefName)) {
      continue;
    }

    map.set(simpleRefName, ref);
  }

  return map;
}

function simplifyRefName(ref: Ref) {
  if (ref.type === RefType.Head && ref.name) {
    return ref.name;
  } else if (ref.type === RefType.RemoteHead && ref.name && ref.remote) {
    return ref.name?.slice(ref.remote.length + 1);
  }
}

// -----------------------------------------------------------------------------
// HELPERS: SYSTEM
// -----------------------------------------------------------------------------

async function parallelize<T>(repositories: Repository[], fn: (repo: Repository) => Promise<T>): Promise<T[]> {
  const promises = repositories.map(fn);
  return Promise.all(promises);
}

function extractUniqueRefNames(maps: RefMap[]): string[] {
  const set = new Set<string>();

  for (const map of maps) {
    for (const key of map.keys()) {
      set.add(key);
    }
  }

  return [...set].sort();
}
