export interface ApiMetadataRequestBody {
  api_key: string
  editor: 'vscode'
  machine_name: string
  os: string
}

export interface HeartbeatSegment {
  start_time: string
  end_time: string
  segment_type: 'coding' | 'debugging' | string
  human_line_changes: number
  ai_line_changes: number
}

export interface HeartbeatFile {
  file_path: string
  lang: string
  segments: HeartbeatSegment[]
}

export interface HeartbeatSession {
  project_path: string
  files: HeartbeatFile[]
}

export interface HeartbeatRequestBody {
  session: HeartbeatSession
}

export interface Lines {
  [fileName: string]: number
}

export interface LineCounts {
  ai: Lines
  human: Lines
}

export interface HeartbeatFileSegments {
  [fileName: string]: { segments: HeartbeatSegment[]; lang: string }
}
