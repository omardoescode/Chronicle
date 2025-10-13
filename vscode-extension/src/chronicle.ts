import * as vscode from 'vscode'
import { apiKeyInvalid } from './utils'
import { APIRequester } from './api_requester'
import {
  ApiMetadataRequestBody,
  HeartbeatFile,
  HeartbeatFileSegments,
  HeartbeatRequestBody,
  HeartbeatSegment,
  LineCounts,
  Lines,
} from './types'

export class Chronicle {
  private apiKey: string = ''
  private disposable: vscode.Disposable | undefined = undefined
  private apiRequester: APIRequester | undefined = undefined
  private readonly heartbeatInterval = 0.25 * 60 * 1000 // 2 minutes
  private lastHeartbeat: number = 0
  private heartbeatFileSegments: HeartbeatFileSegments = {}
  private linesInFiles: Lines = {}
  private lineChanges: LineCounts = { ai: {}, human: {} }
  private focusedFile: string | undefined = undefined
  private focusedFileLang: string | undefined = undefined
  private focusedFileAt: number = 0
  private isDebugging: boolean = false
  private isAIEditing: boolean = false

  constructor() {}

  public async initialize() {
    await this.checkForApiKey()
    this.apiRequester = APIRequester.getInstance(this.apiKey)
    this.sendApiMetadata()
    this.checkForOpenFile()
    this.setupEventListeners()
  }

  private async checkForApiKey(): Promise<void> {
    const storedKey = await vscode.workspace
      .getConfiguration('chronicle')
      .get<string>('apiKey')

    if (storedKey && !apiKeyInvalid(storedKey)) {
      this.apiKey = storedKey
      vscode.window.setStatusBarMessage('Chronicle API key loaded')
      return
    } else {
      // Wait until the user enters a valid API key
      // This will block initialization until a valid key is provided, which is necessary for functionality that depends on the API key being set (e.g., sending heartbeats)
      await new Promise<void>(async (resolve) => {
        await this.promptForApiKey()

        const checkInterval = setInterval(() => {
          if (this.apiKey && !apiKeyInvalid(this.apiKey)) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 200)
      })
    }
  }

  public async promptForApiKey(): Promise<void> {
    let defaultVal = await this.getApiKey()
    if (apiKeyInvalid(defaultVal ?? undefined)) defaultVal = ''

    const promptOptions = {
      prompt: 'Chronicle API Key',
      placeHolder: "Enter your API key from Chronicle's settings",
      value: defaultVal!,
      ignoreFocusOut: true,
      password: true,
      validateInput: apiKeyInvalid,
    }

    await vscode.window.showInputBox(promptOptions).then(async (val) => {
      if (val != undefined) {
        const invalid = apiKeyInvalid(val)
        if (!invalid) {
          await this.setApiKey(val)
        } else {
          vscode.window.setStatusBarMessage(invalid)
        }
      } else {
        vscode.window.setStatusBarMessage('Chronicle API key not provided')
      }
    })
  }

  private async getApiKey(): Promise<string | undefined> {
    return vscode.workspace.getConfiguration('chronicle').get<string>('apiKey')
  }

  private async setApiKey(key: string) {
    await vscode.workspace
      .getConfiguration('chronicle')
      .update('apiKey', key, vscode.ConfigurationTarget.Workspace)
    this.apiKey = key
    vscode.window.setStatusBarMessage('Chronicle API key loaded')
    vscode.window.showInformationMessage('Chronicle API key updated')
  }

  private async sendApiMetadata() {
    if (this.apiRequester) {
      const metadata: ApiMetadataRequestBody = {
        api_key: this.apiKey,
        editor: 'vscode',
        machine_name: require('os').hostname(),
        os: require('os').platform(),
      }
      try {
        const success = await this.apiRequester.setApiMetadata(metadata)
        if (success)
          vscode.window.showInformationMessage(
            'API Metadata sent successfully.'
          )
      } catch (error: any) {
        vscode.window.showErrorMessage(
          'Error sending API metadata: ' + error.message
        )
      }
    }
  }

  private setupEventListeners() {
    const subscriptions: vscode.Disposable[] = []
    // vscode.window.onDidChangeTextEditorSelection(
    //   this.onChangeSelection,
    //   this,
    //   subscriptions
    // )
    vscode.workspace.onDidChangeTextDocument(
      this.onChangeTextDocument,
      this,
      subscriptions
    )
    vscode.window.onDidChangeActiveTextEditor(
      this.onChangeTab,
      this,
      subscriptions
    )
    vscode.workspace.onDidSaveTextDocument(this.onSave, this, subscriptions)

    vscode.debug.onDidStartDebugSession(
      this.onDidStartDebugSession,
      this,
      subscriptions
    )
    vscode.debug.onDidTerminateDebugSession(
      this.onDidTerminateDebugSession,
      this,
      subscriptions
    )

    // create a combined disposable for all event subscriptions
    this.disposable = vscode.Disposable.from(...subscriptions)
  }

  private onChangeSelection(event: vscode.TextEditorSelectionChangeEvent) {
    // console.log('Selection changed:', event.selections)
  }

  private onChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
    this.updateLineNumbers()
    // console.log('Document changed:', event.contentChanges)
  }

  private async onChangeTab(editor: vscode.TextEditor | undefined) {
    this.updateLineNumbers()

    await this.appendFileSegment()

    if (editor) {
      this.focusedFile = editor.document.fileName
      this.focusedFileLang = editor.document.languageId
      this.focusedFileAt = Date.now()
    }

    this.isAIEditing = false

    // console.log('Active editor changed:', editor?.document.uri.toString())
  }

  private onSave(document: vscode.TextDocument) {
    this.updateLineNumbers()
    this.isAIEditing = false

    this.appendFileSegment()

    this.focusedFileAt = Date.now()

    // console.log('Document saved:', document.uri.toString())
  }

  private onDidStartDebugSession() {
    this.isDebugging = true
    this.isAIEditing = false
  }

  private onDidTerminateDebugSession() {
    this.isDebugging = false
  }

  private updateLineNumbers() {
    const doc = vscode.window.activeTextEditor?.document
    if (!doc) return

    const file = doc.fileName
    if (!file) return

    const current_line_count = doc.lineCount
    // if (this.linesInFiles[file] == undefined) {
    //   this.linesInFiles[file] = current_line_count
    // }

    const prev_line_count = this.linesInFiles[file] ?? current_line_count
    const delta = current_line_count - prev_line_count

    const changes = this.isAIEditing
      ? this.lineChanges.ai
      : this.lineChanges.human
    changes[file] = (changes[file] ?? 0) + delta

    this.linesInFiles[file] = current_line_count

    console.log(this.lineChanges)
    console.log(this.linesInFiles)
  }

  private async appendFileSegment() {
    const doc = vscode.window.activeTextEditor?.document
    if (!doc) return

    const file = doc.fileName
    if (!file) return

    console.log('Focused: ', this.focusedFile)
    console.log('New: ', file)

    if (!this.focusedFile) return

    const segment: HeartbeatSegment = {
      start_time: new Date(this.focusedFileAt).toUTCString(),
      end_time: new Date().toUTCString(),
      segment_type: this.isAIEditing
        ? 'ai_coding'
        : this.isDebugging
        ? 'debugging'
        : 'coding',
      human_line_changes: Math.abs(
        this.lineChanges.human[this.focusedFile] ?? 0
      ),
      ai_line_changes: Math.abs(this.lineChanges.ai[this.focusedFile] ?? 0),
    }

    if (segment.ai_line_changes != 0 || segment.human_line_changes != 0) {
      if (!this.heartbeatFileSegments[this.focusedFile]) {
        this.heartbeatFileSegments[this.focusedFile] = {
          segments: [segment],
          lang: this.focusedFileLang!,
        }
      } else {
        this.heartbeatFileSegments[this.focusedFile].segments.push(segment)
      }

      console.log(segment)

      this.lineChanges.human[this.focusedFile] = 0
      this.lineChanges.ai[this.focusedFile] = 0
    }

    const now = Date.now()
    if (now - this.lastHeartbeat > this.heartbeatInterval) {
      await this.sendHeartBeats()
    }
  }

  private async sendHeartBeats() {
    if (this.apiKey) {
      let filesData: HeartbeatFile[] = []

      for (const file in this.heartbeatFileSegments) {
        filesData.push({
          file_path: file,
          lang: this.heartbeatFileSegments[file].lang,
          segments: this.heartbeatFileSegments[file].segments,
        })
      }

      if (filesData.length == 0) return

      const request_body: HeartbeatRequestBody = {
        session: {
          project_path: vscode.workspace.getWorkspaceFolder(
            vscode.Uri.file(filesData[0].file_path)
          )!.uri.fsPath,
          files: filesData,
        },
      }

      console.log(request_body)
      let success = false

      try {
        success = await this.apiRequester?.sendHeartbeat(request_body)
      } catch (error) {
        vscode.window.showErrorMessage(
          'Failed to send heartbeat now, aborting.'
        )
        return
      }

      if (!success) {
        vscode.window.showErrorMessage(
          'Failed to send heartbeat now, aborting.'
        )
        return
      }

      this.heartbeatFileSegments = {}

      const now = Date.now()
      this.lastHeartbeat = now

      vscode.window.showInformationMessage('Heartbeat sent successfully')
    } else {
      vscode.window.showErrorMessage('Chronicle API key not set')
      this.promptForApiKey()
    }
  }

  private checkForOpenFile() {
    const doc = vscode.window.activeTextEditor?.document
    if (!doc) return

    const file = doc.fileName
    if (!file) return

    this.focusedFile = file
    this.focusedFileLang = doc.languageId
    this.focusedFileAt = Date.now()
  }

  public dispose() {
    this.sendHeartBeats()
    this.disposable?.dispose()
  }
}
