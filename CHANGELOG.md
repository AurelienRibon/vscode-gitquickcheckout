# Changelog

## [1.7.2] - 2021-12-21
### Fixed
- [command:createBranches] Remove pre-selection of repositories already having the branch.

## [1.7.1] - 2021-12-08
### Fixed
- [command:createBranches] Ensure use of `defaultBranchName` instead of hardcoded `master`.

## [1.7.0] - 2021-12-08
### Added
- [command:createBranches] Pre-populate branch name if any repo is not on master.
- [command:createBranches] Pre-pick repositories which contain changes.

## [1.6.0] - 2021-03-17
### Added
- Add command `createBranches`, to create a new branch in multiple repositories at once.

## [1.5.0] - 2021-03-17
### Added
- Add command `fetchAll`, to fetch remotes for all repositories at once.

## [1.4.0] - 2020-11-05
### Added
- Use vscode Git API instead of command line one, for better integration.
- Add icons before each quickpick choice.
- Move default branch name as first choice.

## [1.3.0] - 2020-11-02
### Added
- Converted the project to Typescript.
### Fixed
- Fix checkout of remote branches when they were never checked-out locally.

## [1.2.1] - 2020-08-27
### Fixed
- Fix config param `defaultBranchName` not taken into account.

## [1.2.0] - 2020-08-27
### Added
- Show a brief message in status bar when checkout has been done.

## [1.0.0] - 2020-08-27
### Added
- Initial release, base functionality.
