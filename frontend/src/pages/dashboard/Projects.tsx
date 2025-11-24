import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart } from '@tremor/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { DaysRangePicker } from '@/components/days-range-picker'
import { fetchGraphQL } from '@/lib/api'
import {
  ANALYTICS_QUERY,
  DashboardResponse,
  SessionData,
  AnalyticsData,
  formatDuration,
  transformToChartData,
  formatDateAsIs,
  EMPTY_ANALYTICS_DATA,
} from '@/lib/analytics'
import { shuffleArray, BASE_COLORS } from '@/lib/colors'

export default function ProjectsPage() {
  const [stats, setStats] = useState<AnalyticsData | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [queryDays, setQueryDays] = useState(14)
  const [chartKey, setChartKey] = useState(0)

  const colors = useMemo(() => shuffleArray(BASE_COLORS), [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - (queryDays - 1))

        const start = formatDateAsIs(date)
        const res = await fetchGraphQL<DashboardResponse>(ANALYTICS_QUERY, {
          start,
          count: queryDays,
        }).catch(() => null)

        setStats(res?.UserAnaltyics?.data || EMPTY_ANALYTICS_DATA)
        setSessions(
          (res?.UserProjectSessions?.data || []).sort(
            (a, b) =>
              new Date(b.window_start).getTime() -
              new Date(a.window_start).getTime()
          )
        )
      } catch (error) {
        console.error(error)
        setStats(EMPTY_ANALYTICS_DATA)
      } finally {
        setChartKey((prev) => prev + 1)
        setLoading(false)
      }
    }
    loadData()
  }, [queryDays])

  if (loading && !stats)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  const safeStats = stats || EMPTY_ANALYTICS_DATA
  const chartData = transformToChartData(safeStats.project_durations).map(
    ({ value: time_spent, ...rest }) => ({ time_spent, ...rest })
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <DaysRangePicker value={queryDays} onChange={setQueryDays} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time per Project (Last {queryDays} Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            key={chartKey}
            className="h-72"
            data={chartData}
            index="name"
            categories={['time_spent']}
            colors={colors}
            valueFormatter={formatDuration}
            yAxisWidth={100}
            layout="vertical"
            showAnimation
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[600px] overflow-y-auto custom-scrollbar relative">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead>Project Path</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium font-mono text-xs truncate max-w-[300px]">
                      {session.project_path.split(/[\\/]/).pop() || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {new Date(session.window_start).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(session.work_duration_ms)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
