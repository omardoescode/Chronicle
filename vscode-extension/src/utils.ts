import * as vscode from 'vscode'

export function apiKeyInvalid(apiKey: string | undefined): string {
  if (!apiKey || apiKey.length === 0) {
    return 'API Key cannot be empty'
  }
  // SHA256 hashes are 64 hex characters
  if (!/^[0-9a-f]{64}$/i.test(apiKey)) {
    return 'API Key must be a valid SHA256 hash'
  }
  return ''
}

export function isAIEdit(event: vscode.TextDocumentChangeEvent): boolean {
  if (isAIChatSidebar(event.document.uri)) {
    return true
  }

  const PASTE_LINE_THRESHOLD = 3
  const SINGLE_LINE_CHAR_THRESHOLD = 40

  // Check for large pastes or single-line large inserts
  if (event.reason === undefined && event.contentChanges.length === 1) {
    const change = event.contentChanges[0]

    if (change.text.length > 0) {
      const lineCount = change.text.split('\n').length

      if (lineCount >= PASTE_LINE_THRESHOLD) {
        return true
      }

      if (lineCount === 1 && change.text.length >= SINGLE_LINE_CHAR_THRESHOLD) {
        return true
      }
    }
  }

  // Likely a human edit
  return false
}
export function isAIChatSidebar(uri: vscode.Uri | undefined): boolean {
  if (!uri) return false

  return uri.scheme === 'vscode-chat-code-block'
}
