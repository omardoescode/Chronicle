import { useEffect, useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, DonutChart, Legend } from '@tremor/react'
import { Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DaysRangePicker } from '@/components/days-range-picker'
import { fetchGraphQL } from '@/lib/api'
import {
  ANALYTICS_QUERY,
  DashboardResponse,
  AnalyticsData,
  SessionData,
  transformToChartData,
  formatDuration,
  formatDateAsIs,
  EMPTY_ANALYTICS_DATA,
} from '@/lib/analytics'
import { shuffleArray, BASE_COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

function getDateRange(days: number) {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d)
  }
  return dates
}

function getIntensityColor(minutes: number) {
  if (minutes === 0) return 'bg-muted/50'
  if (minutes < 15) return 'bg-chart-1/30'
  if (minutes < 60) return 'bg-chart-1/60'
  if (minutes < 120) return 'bg-chart-1/80'
  return 'bg-chart-1'
}

const ContributionGraph = ({
  sessions,
  days,
}: {
  sessions: SessionData[]
  days: number
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const activityMap = useMemo(() => {
    return sessions.reduce((acc, session) => {
      const dateStr = session.window_start.split(' ')[0].split('T')[0]
      const minutes = session.work_duration_ms / 1000 / 60
      acc[dateStr] = (acc[dateStr] || 0) + minutes
      return acc
    }, {} as Record<string, number>)
  }, [sessions])

  const weeks = useMemo(() => {
    const dates = getDateRange(days)
    const weeksArr: Date[][] = []
    let currentWeek: Date[] = []

    dates.forEach((date) => {
      if (date.getDay() === 0 && currentWeek.length > 0) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(date)
    })
    if (currentWeek.length > 0) weeksArr.push(currentWeek)
    return weeksArr
  }, [days])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [sessions, days])

  return (
    <div className="w-full border rounded-md bg-card flex flex-col overflow-hidden min-w-0">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2 bg-card shrink-0">
        <h4 className="text-sm font-medium whitespace-nowrap">
          Contribution Activity
        </h4>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 10, 30, 90].map((v, i) => (
              <div
                key={i}
                className={cn('w-3 h-3 rounded-sm', getIntensityColor(v))}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="relative w-full min-w-0 bg-card">
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto pb-4 px-4 custom-scrollbar"
        >
          <div className="flex gap-1 min-w-max justify-center">
            <div className="flex flex-col gap-1 pr-2 text-[10px] text-muted-foreground pt-6 sticky left-0 bg-card/95 backdrop-blur z-20">
              <div className="h-3 flex items-center">Mon</div>
              <div className="h-3" />
              <div className="h-3 flex items-center">Wed</div>
              <div className="h-3" />
              <div className="h-3 flex items-center">Fri</div>
            </div>

            <TooltipProvider delayDuration={0}>
              {weeks.map((week, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-4 text-[10px] text-muted-foreground mb-1 w-3 whitespace-nowrap">
                    {week[0].getDate() <= 7
                      ? week[0].toLocaleDateString('en-US', { month: 'short' })
                      : ''}
                  </div>
                  {week.map((day) => {
                    const dateKey = formatDateAsIs(day).split('T')[0]
                    const minutes = activityMap[dateKey] || 0
                    return (
                      <Tooltip key={dateKey}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-3 h-3 rounded-[2px] transition-colors hover:ring-1 hover:ring-ring hover:z-10',
                              getIntensityColor(minutes)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs">
                            <span className="font-semibold">
                              {minutes
                                ? formatDuration(minutes * 60 * 1000)
                                : 'No activity'}
                            </span>
                            <div className="text-muted-foreground">
                              {day.toLocaleDateString()}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [chartKey, setChartKey] = useState(0)
  const [queryDays, setQueryDays] = useState(365)

  const [colors] = useState(() => ({
    trend: shuffleArray(BASE_COLORS),
    editor: shuffleArray(BASE_COLORS),
    machine: shuffleArray(BASE_COLORS),
  }))

  const languages = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.lang || 'Unknown'))),
    [sessions]
  )

  const recentChartData = useMemo(() => {
    const dates = getDateRange(Math.min(30, queryDays))
    const lookup = sessions.reduce((acc, s) => {
      const d = s.window_start.split(' ')[0].split('T')[0]
      const l = s.lang || 'Unknown'
      const m = s.work_duration_ms / 1000 / 60
      if (!acc[d]) acc[d] = {}
      acc[d][l] = (acc[d][l] || 0) + m
      return acc
    }, {} as Record<string, Record<string, number>>)

    return dates.map((date) => {
      const iso = formatDateAsIs(date).split('T')[0]
      return {
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        ...languages.reduce(
          (acc, lang) => ({ ...acc, [lang]: lookup[iso]?.[lang] || 0 }),
          {}
        ),
      }
    })
  }, [sessions, queryDays, languages])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - (queryDays - 1))

        const res = await fetchGraphQL<DashboardResponse>(ANALYTICS_QUERY, {
          start: formatDateAsIs(date),
          count: queryDays,
        }).catch(() => null)

        setAnalytics(res?.UserAnaltyics?.data || EMPTY_ANALYTICS_DATA)
        setSessions(res?.UserLangSessions?.data || [])
      } catch (err) {
        console.error(err)
        setAnalytics(EMPTY_ANALYTICS_DATA)
      } finally {
        setChartKey((prev) => prev + 1)
        setLoading(false)
      }
    }
    loadData()
  }, [queryDays])

  if (loading && !analytics)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  const data = analytics || EMPTY_ANALYTICS_DATA
  const editors = transformToChartData(data.editor_durations)
  const machines = transformToChartData(data.machine_durations)

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deep Analytics</h2>
        <DaysRangePicker value={queryDays} onChange={setQueryDays} />
      </div>

      <Card className="w-full overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle>{queryDays}-Day Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <ContributionGraph sessions={sessions} days={queryDays} />
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Activity Trend (Recent)</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            key={chartKey}
            className="h-72 mt-4"
            data={recentChartData}
            index="date"
            categories={languages}
            colors={colors.trend}
            valueFormatter={(v) => `${Math.round(v)}m`}
            connectNulls
            showAnimation
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Editors Used</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <DonutChart
              key={chartKey}
              data={editors}
              category="value"
              index="name"
              valueFormatter={formatDuration}
              colors={colors.editor}
              className="h-60"
              showAnimation
            />
            <Legend
              categories={editors.map((e) => e.name)}
              colors={colors.editor}
              className="mt-6"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Machines</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <DonutChart
              key={chartKey}
              data={machines}
              category="value"
              index="name"
              valueFormatter={formatDuration}
              colors={colors.machine}
              className="h-60"
              showAnimation
            />
            <Legend
              categories={machines.map((e) => e.name)}
              colors={colors.machine}
              className="mt-6"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
