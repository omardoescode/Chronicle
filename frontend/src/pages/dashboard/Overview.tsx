import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, DonutChart, List, ListItem, Legend } from '@tremor/react'
import {
  Loader2,
  Clock,
  Code,
  TrendingUp,
  TrendingDown,
  Trophy,
  Calculator,
} from 'lucide-react'
import { DaysRangePicker } from '@/components/days-range-picker'
import { fetchGraphQL } from '@/lib/api'
import {
  ANALYTICS_QUERY,
  DashboardResponse,
  AnalyticsData,
  SessionData,
  formatDuration,
  transformToChartData,
  processDailySessions,
  formatDateAsIs,
  EMPTY_ANALYTICS_DATA,
} from '@/lib/analytics'
import { shuffleArray, BASE_COLORS } from '@/lib/colors'

export default function DashboardOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [prevTotal, setPrevTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [chartKey, setChartKey] = useState(0)
  const [queryDays, setQueryDays] = useState(7)

  const [colors] = useState(() => ({
    daily: shuffleArray(BASE_COLORS),
    lang: shuffleArray(BASE_COLORS),
    activity: shuffleArray(BASE_COLORS),
  }))

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const currentStart = new Date(today)
        currentStart.setDate(today.getDate() - (queryDays - 1))

        const prevStart = new Date(currentStart)
        prevStart.setDate(currentStart.getDate() - queryDays)

        const [currentRes, prevRes] = await Promise.all([
          fetchGraphQL<DashboardResponse>(ANALYTICS_QUERY, {
            start: formatDateAsIs(currentStart),
            count: queryDays,
          }).catch(() => null),
          fetchGraphQL<DashboardResponse>(ANALYTICS_QUERY, {
            start: formatDateAsIs(prevStart),
            count: queryDays,
          }).catch(() => null),
        ])

        setData(currentRes?.UserAnaltyics?.data || EMPTY_ANALYTICS_DATA)
        setSessions(currentRes?.UserProjectSessions?.data || [])
        setPrevTotal(prevRes?.UserAnaltyics?.data?.work_duration_ms || 0)
      } catch (error) {
        console.error('Data load error:', error)
        setData(EMPTY_ANALYTICS_DATA)
      } finally {
        setChartKey((prev) => prev + 1)
        setLoading(false)
      }
    }
    loadData()
  }, [queryDays])

  if (loading && !data)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  const safeData = data || EMPTY_ANALYTICS_DATA
  const topLanguages = transformToChartData(safeData.lang_durations)
  const topProjects = transformToChartData(safeData.project_durations)
  const activities = transformToChartData(safeData.activity_durations)
  const dailyActivity = processDailySessions(sessions, queryDays)

  const projectNames = Array.from(
    new Set(
      sessions.map((s) => s.project_path?.split(/[\\/]/).pop() || 'Unknown')
    )
  )

  const dailyAverageMs = safeData.work_duration_ms / queryDays
  const trendDiff = safeData.work_duration_ms - prevTotal
  const trendPercent =
    prevTotal > 0 ? Math.round((trendDiff / prevTotal) * 100) : 0
  const isTrendUp = trendDiff >= 0

  const bestDay = dailyActivity.reduce(
    (max, day) => {
      const total = Object.values(day).reduce(
        (sum, val) => (typeof val === 'number' ? sum + val : sum),
        0
      ) as number
      return total > max.value
        ? { date: day.date as string, value: total }
        : max
    },
    { date: '', value: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Stats for the last {queryDays} days
          </p>
        </div>
        <DaysRangePicker value={queryDays} onChange={setQueryDays} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(safeData.work_duration_ms)}
            </div>
            <div
              className={`flex items-center text-xs ${
                isTrendUp ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isTrendUp ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {Math.abs(trendPercent)}% {isTrendUp ? 'increase' : 'decrease'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(dailyAverageMs)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per day over {queryDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestDay.date || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {bestDay.value > 0
                ? `${bestDay.value.toFixed(1)} hrs recorded`
                : 'No activity'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Language</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topLanguages[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Most used language</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Coding Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            key={chartKey}
            className="h-72"
            data={dailyActivity}
            index="date"
            categories={projectNames}
            colors={colors.daily}
            valueFormatter={(number) => {
              if (number > 0 && number < 0.1) return '<0.1h'
              return `${number.toFixed(1)}h`
            }}
            stack
            yAxisWidth={50}
            showAnimation
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <DonutChart
              key={chartKey}
              data={topLanguages}
              category="value"
              index="name"
              valueFormatter={formatDuration}
              colors={colors.lang}
              className="h-40"
              showAnimation
            />
            <Legend
              categories={topLanguages.map((l) => l.name)}
              colors={colors.lang}
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <DonutChart
              key={chartKey}
              data={activities}
              category="value"
              index="name"
              valueFormatter={formatDuration}
              colors={colors.activity}
              className="h-40"
              showAnimation
            />
            <Legend
              categories={activities.map((a) => a.name)}
              colors={colors.activity}
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <List>
              {topProjects.slice(0, 5).map((item) => (
                <ListItem key={item.name}>
                  <span className="truncate max-w-[150px]">{item.name}</span>
                  <span>{formatDuration(item.value)}</span>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
