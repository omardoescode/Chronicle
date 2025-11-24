export const ANALYTICS_QUERY = `
  query UserDashboardData($start: Any!, $count: Number!) {
    UserAnaltyics(window: {start: $start, interval: {unit: day, count: $count}}) {
      data {
        lang_durations
        project_durations
        editor_durations
        activity_durations
        machine_durations
        work_duration_ms
        active_days
      }
      success
      errors
    }
    UserProjectSessions(window: {start: $start, interval: {unit: day, count: $count}}) {
      data {
        project_path
        work_duration_ms
        window_start
        window_end
      }
      success
      errors
    }
    UserLangSessions(window: {start: $start, interval: {unit: month, count: $count}}) {
      data {
        lang
        work_duration_ms
        window_start
        window_end
      }
      success
      errors
    }
  }
`

export interface AnalyticsData {
  lang_durations: Record<string, number>
  project_durations: Record<string, number>
  editor_durations: Record<string, number>
  machine_durations: Record<string, number>
  activity_durations: Record<string, number>
  work_duration_ms: number
  active_days: number
}

export interface SessionData {
  project_path?: string
  lang?: string
  work_duration_ms: number
  window_start: string
  window_end: string
}

export interface DashboardResponse {
  UserAnaltyics: { data: AnalyticsData; success: boolean }
  UserProjectSessions: { data: SessionData[]; success: boolean }
  UserLangSessions: { data: SessionData[]; success: boolean }
}

export const EMPTY_ANALYTICS_DATA: AnalyticsData = {
  lang_durations: {},
  project_durations: {},
  editor_durations: {},
  activity_durations: {},
  machine_durations: {},
  work_duration_ms: 0,
  active_days: 0,
}

// Prevents -1 day shift from UTC conversion by offsetting the date
export function formatDateAsIs(date: Date) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString()
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

export function transformToChartData(
  record: Record<string, number> | undefined
) {
  if (!record) return []
  return Object.entries(record)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function processDailySessions(sessions: SessionData[], days = 7) {
  const dailyMap = new Map<string, Record<string, number>>()

  // Initialize empty days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    dailyMap.set(key, { date: key } as any)
  }

  sessions.forEach((session) => {
    // Parse manually to avoid UTC shifts: "YYYY-MM-DD"
    const [y, m, d] = session.window_start.split('T')[0].split('-').map(Number)
    const dateKey = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const projectName = session.project_path?.split(/[\\/]/).pop() || 'Unknown'

    if (dailyMap.has(dateKey)) {
      const entry = dailyMap.get(dateKey)!
      const hours = session.work_duration_ms / 1000 / 60 / 60
      entry[projectName] = (entry[projectName] || 0) + hours
    }
  })

  return Array.from(dailyMap.values())
}
