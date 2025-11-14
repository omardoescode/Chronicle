// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Chronicle } from './chronicle'
import * as fs from 'fs'

var chronicle: Chronicle
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "chronicle" is now active!')

  const globalStorageDir = context.globalStorageUri.fsPath
  const logDir = context.logUri.fsPath

  fs.mkdirSync(globalStorageDir, { recursive: true })
  fs.mkdirSync(logDir, { recursive: true })

  console.log('Global Storage Dir: ', globalStorageDir)
  console.log('Log Dir: ', logDir)

  chronicle = new Chronicle(globalStorageDir, logDir)

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand('chronicle.toggleDebug', () => {
      chronicle.toggleDebugging()
      vscode.window.showInformationMessage(
        'Toggling Debugging for Chronicle! [Developer Feature]'
      )
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('chronicle.apiKey', function () {
      chronicle.promptForApiKey()
    })
  )

  context.subscriptions.push(chronicle)

  chronicle.initialize()
}

// This method is called when your extension is deactivated
export function deactivate() {
  chronicle.dispose()
}
