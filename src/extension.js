'use strict';

const vscode = require('vscode');
const commandCheckoutAll = require('./command-checkoutall');

const COMMANDS = [commandCheckoutAll];

exports.activate = function (context) {
  for (const { commandId, execute } of COMMANDS) {
    const disposable = vscode.commands.registerCommand(commandId, execute);
    context.subscriptions.push(disposable);
  }
};

exports.deactivate = function () {
  void 0;
};
