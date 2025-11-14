import * as vscode from 'vscode'
import { apiKeyInvalid, isAIEdit } from './utils'
import { APIRequester } from './api_requester'
import { ChronicleConfig } from './configs'
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
  private config: ChronicleConfig | undefined = undefined
  private disposable: vscode.Disposable | undefined = undefined
  private apiRequester: APIRequester | undefined = undefined
  private readonly heartbeatInterval = 0.25 * 60 * 1000 // 2 minutes
  private readonly editingInterval = 2 * 60 * 1000 // 2 minutes
  private lastHeartbeat: number = 0
  private heartbeatFileSegments: HeartbeatFileSegments = {}
  private linesInFiles: Lines = {}
  private lineChanges: LineCounts = { ai: {}, human: {} }
  private focusedFile: string | undefined = undefined
  private focusedFileLang: string | undefined = undefined
  private focusedFileAt: number = 0
  private lastEditAt: number = 0
  private isDebugging: boolean = false
  private isAIEditing: boolean = false
  private debuggingAllowed: boolean = false

  constructor() {
    this.config = new ChronicleConfig()
  }

  public async initialize() {
    this.readDebuggingSetting()
    await this.checkForApiKey()
    this.checkForOpenFile()
    this.setupEventListeners()
  }

  private async checkForApiKey(): Promise<void> {
    const storedKey = this.config?.getApiKey()

    if (storedKey && !apiKeyInvalid(storedKey)) {
      await this.loadApiKey(storedKey)
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
    return this.config?.getApiKey() || this.apiKey
  }

  private async loadApiKey(key: string) {
    this.apiKey = key
    this.apiRequester = APIRequester.getInstance(this.apiKey)
    await this.sendApiMetadata()
  }

  private async setApiKey(key: string) {
    this.config?.setApiKey(key)
    this.apiKey = key
    this.apiRequester = APIRequester.getInstance(this.apiKey)
    await this.sendApiMetadata()
    if (this.debuggingAllowed) {
      vscode.window.showInformationMessage('Chronicle API key updated')
    }
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
        if (success) {
          if (this.debuggingAllowed) {
            vscode.window.showInformationMessage(
              'API Metadata sent successfully.'
            )
          }
          this.config?.log(
            'API Metadata sent successfully for api_key: ' + this.apiKey
          )
        }
      } catch (error: any) {
        if (this.debuggingAllowed) {
          if (error.cause[0].includes('METADATA_EXISTS')) {
            vscode.window.showInformationMessage(
              'API Metadata already exists on server.'
            )
            return
          }

          vscode.window.showErrorMessage(
            'Error sending API metadata: ' +
              error.message +
              ' Cause: ' +
              error.cause
          )
        }

        if (error.cause[0].includes('METADATA_EXISTS')) {
          return
        }

        this.config?.log(
          'Error sending API metadata: ' +
            error.message +
            ' Cause: ' +
            error.cause
        )

        vscode.window.showErrorMessage(
          'Chronicle API key seems invalid, please enter a valid key.'
        )

        await this.promptForApiKey()
      }
    }
  }

  private setupEventListeners() {
    const subscriptions: vscode.Disposable[] = []
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

  private onChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
    if (isAIEdit(event)) {
      this.isAIEditing = true
    }

    if (
      this.lastEditAt != 0 &&
      this.lastEditAt < Date.now() - this.editingInterval
    ) {
      this.appendFileSegment(new Date(this.lastEditAt))
      this.focusedFileAt = Date.now()
    }

    this.updateLineNumbers()
    this.lastEditAt = Date.now()

    if (this.isAIEditing) {
      this.isAIEditing = false
    }
  }

  private async onChangeTab(editor: vscode.TextEditor | undefined) {
    await this.appendFileSegment()

    if (editor) {
      this.focusedFile = editor.document.fileName
      this.focusedFileLang = editor.document.languageId
      this.focusedFileAt = Date.now()
    }

    this.isAIEditing = false
  }

  private onSave(document: vscode.TextDocument) {
    this.isAIEditing = false

    this.appendFileSegment()

    this.focusedFileAt = Date.now()
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

    const prev_line_count = this.linesInFiles[file] ?? current_line_count
    const delta = current_line_count - prev_line_count

    const changes = this.isAIEditing
      ? this.lineChanges.ai
      : this.lineChanges.human
    changes[file] = (changes[file] ?? 0) + delta

    this.linesInFiles[file] = current_line_count
  }

  private async appendFileSegment(end_time: Date = new Date()) {
    const doc = vscode.window.activeTextEditor?.document
    if (!doc) return

    const file = doc.fileName
    if (!file) return

    if (!this.focusedFile) return

    const segment: HeartbeatSegment = {
      start_time: new Date(this.focusedFileAt).toUTCString(),
      end_time: end_time.toUTCString(),
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

      this.config?.log(
        `Appending segment for file ${this.focusedFile}: ${JSON.stringify(
          segment
        )}`
      )

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

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(filesData[0].file_path)
      )

      let request_body: HeartbeatRequestBody

      if (workspaceFolder && workspaceFolder.uri.scheme !== 'untitled') {
        request_body = {
          session: {
            project_path: workspaceFolder.uri.fsPath,
            files: filesData,
          },
        }
      } else {
        request_body = {
          session: {
            files: filesData,
          },
        }
      }

      this.config?.log(
        `Sending heartbeat with last ${filesData.length} files segments`
      )

      let success = false

      try {
        success = await this.apiRequester?.sendHeartbeat(request_body)
      } catch (error: any) {
        if (this.debuggingAllowed) {
          vscode.window.showErrorMessage(
            'Failed to send heartbeat now, aborting. ' +
              error.message +
              ' ,Cause: ' +
              error.cause
          )
        }
        this.config?.log(
          'Failed to send heartbeat: ' +
            error.message +
            ' ,Cause: ' +
            error.cause
        )
        return
      }

      if (!success) {
        if (this.debuggingAllowed) {
          vscode.window.showErrorMessage(
            'Failed to send heartbeat now, aborting.'
          )
        }
        this.config?.log(
          'Failed to send heartbeat: Unknown error, no success response.'
        )

        return
      }

      this.heartbeatFileSegments = {}

      const now = Date.now()
      this.lastHeartbeat = now

      if (this.debuggingAllowed) {
        vscode.window.showInformationMessage('Heartbeat sent successfully')
      }
      this.config?.log('Heartbeat sent successfully')
    } else {
      if (this.debuggingAllowed) {
        vscode.window.showErrorMessage('Chronicle API key not set')
      }
      this.config?.log('Chronicle API key not set, cannot send heartbeat')
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

  private readDebuggingSetting() {
    const debug_mode =
      vscode.workspace
        .getConfiguration('chronicle')
        .get<boolean>('allowDebug') || false

    this.debuggingAllowed = debug_mode
  }

  public toggleDebugging() {
    const debug_mode = vscode.workspace
      .getConfiguration('chronicle')
      .get<boolean>('allowDebug')

    vscode.workspace
      .getConfiguration('chronicle')
      .update('allowDebug', !debug_mode, true)

    this.debuggingAllowed = !debug_mode

    vscode.window.setStatusBarMessage(
      `Chronicle Debug Mode: ${!debug_mode ? 'Enabled' : 'Disabled'}`
    )
  }

  public dispose() {
    this.sendHeartBeats()
    this.disposable?.dispose()
  }
}
