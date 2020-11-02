'use strict';

import * as vscode from 'vscode';
import commandCheckoutAll from './command-checkoutall';

const COMMANDS = [commandCheckoutAll];

export function activate(context: vscode.ExtensionContext): void {
  for (const { commandId, execute } of COMMANDS) {
    const disposable = vscode.commands.registerCommand(commandId, execute);
    context.subscriptions.push(disposable);
  }
}

export function deactivate(): void {
  void 0;
}
