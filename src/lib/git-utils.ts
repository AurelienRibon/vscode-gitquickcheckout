'use strict';

import * as vscode from 'vscode';
import * as vsUtils from './vs-utils';
import { GitExtension, Ref, RefType, Repository } from '../types/git';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type RefMap = Map<string, Set<Repository>>;

export interface GitContext {
  repos: Repository[];
  refNames: string[];
  refNamesMap: RefMap;
}

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

export function getRepoName(repo: Repository): string {
  const { path } = repo.rootUri;
  const lastSepIndex = path.lastIndexOf('/');
  return lastSepIndex === -1 ? path : path.slice(lastSepIndex + 1);
}

export function listRefNames(): GitContext {
  const repos = getRepos();
  const refNamesMap = new Map() as RefMap;
  repos.forEach((it) => registerRefNames(it, refNamesMap));

  const refNames = [...refNamesMap.keys()].sort();
  return { repos, refNames, refNamesMap };
}

export async function checkoutRef(refName: string, context: GitContext): Promise<void> {
  const reposWithRef = getReposWithRef(refName, context);
  await parallelize(reposWithRef, (repo) => checkoutRepoRef(repo, refName));

  const reposWithoutRef = getReposWithoutRef(refName, context);
  await checkoutReposDefaultRef(context, reposWithoutRef);
}

export async function checkoutDefaultRef(context: GitContext): Promise<void> {
  const defaultRefNames = vsUtils.getOption('defaultBranchNames');

  for (const refName of defaultRefNames) {
    const reposWithRef = getReposWithRef(refName, context);
    await parallelize(reposWithRef, (repo) => checkoutRepoRef(repo, refName));
  }
}

export async function fetchRepos(context: GitContext): Promise<void> {
  await parallelize(context.repos, (repo) => fetchRepo(repo));
}

export async function createBranches(reposNames: string[], branchName: string, context: GitContext): Promise<void> {
  const repos = context.repos.filter((repo) => reposNames.includes(getRepoName(repo)));
  await parallelize(repos, (repo) => createBranch(repo, branchName));
}

// -----------------------------------------------------------------------------
// HELPERS: GIT MUTATORS
// -----------------------------------------------------------------------------

async function checkoutRepoRef(repo: Repository, refName: string): Promise<void> {
  if (refName === simplifyRefName(repo.state.HEAD)) {
    return;
  }

  try {
    await repo.checkout(refName);
  } catch (err) {
    const path = repo.rootUri.fsPath;
    console.error(`Failed to checkout ref in folder ${path}. ${err.message}`);
  }
}

async function checkoutReposDefaultRef(context: GitContext, repos: Repository[]): Promise<void> {
  const defaultRefNames = vsUtils.getOption('defaultBranchNames');

  for (const refName of defaultRefNames) {
    const reposWithRef = getReposWithRef(refName, context);
    const reposToCheckout = intersectRepos(repos, reposWithRef);
    await parallelize(reposToCheckout, (repo) => checkoutRepoRef(repo, refName));
  }
}

async function fetchRepo(repo: Repository): Promise<void> {
  try {
    await repo.fetch();
  } catch (err) {
    const path = repo.rootUri.fsPath;
    console.error(`Failed to fetch repo in folder ${path}. ${err.message}`);
  }
}

async function createBranch(repo: Repository, branchName: string): Promise<void> {
  try {
    await repo.createBranch(branchName, true);
  } catch (err) {
    const path = repo.rootUri.fsPath;
    console.error(`Failed to create branch '${branchName}' in folder ${path}. ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// HELPERS: GIT GETTERS
// -----------------------------------------------------------------------------

function getRepos(): Repository[] {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
  const api = gitExtension?.getAPI(1);
  return api ? api.repositories : [];
}

function getReposWithRef(refName: string, context: GitContext): Repository[] {
  const reposSet = context.refNamesMap.get(refName);
  return reposSet ? Array.from(reposSet) : [];
}

function getReposWithoutRef(refName: string, context: GitContext): Repository[] {
  const reposWithRef = context.refNamesMap.get(refName) || new Set();
  return context.repos.filter((it) => !reposWithRef.has(it));
}

function intersectRepos(repos1: Repository[], repos2: Repository[]): Repository[] {
  const intersection = [] as Repository[];
  const repos2NameSet = new Set(repos2.map(getRepoName));

  for (const repo1 of repos1) {
    const repo1Name = getRepoName(repo1);
    if (repos2NameSet.has(repo1Name)) {
      intersection.push(repo1);
    }
  }

  return intersection;
}

// -----------------------------------------------------------------------------
// HELPERS: REF MAPPING
// -----------------------------------------------------------------------------

function registerRefNames(repo: Repository, map: RefMap): void {
  const refNames = repo.state.refs.map(simplifyRefName).filter(isString);

  for (const refName of refNames) {
    if (refName === 'HEAD') {
      continue;
    }

    let bucket = map.get(refName);
    if (!bucket) {
      bucket = new Set();
      map.set(refName, bucket);
    }

    bucket.add(repo);
  }
}

function simplifyRefName(ref?: Ref) {
  if (!ref || !ref.name) {
    return undefined;
  } else if (ref.type === RefType.Head) {
    return ref.name;
  } else if (ref.type === RefType.RemoteHead && ref.remote) {
    return ref.name?.slice(ref.remote.length + 1);
  }
}

// -----------------------------------------------------------------------------
// HELPERS: SYSTEM
// -----------------------------------------------------------------------------

async function parallelize<T>(repos: Repository[], fn: (repo: Repository) => Promise<T>): Promise<T[]> {
  const promises = repos.map(fn);
  return Promise.all(promises);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
