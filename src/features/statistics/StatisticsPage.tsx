import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useUserSettings } from '../settings/useUserSettings'
import { formatChartMinutes, formatStudyDuration } from './statistics.utils'
import { useStudyStatistics } from './useStudyStatistics'
import type { StatisticsRange } from './statistics.types'

const ranges: Array<{ label: string; value: StatisticsRange }> = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
]

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  )
}

export function StatisticsPage() {
  const { settings } = useUserSettings()
  const {
    error,
    isLoading,
    loadStatistics,
    selectedRange,
    setSelectedRange,
    statistics,
    streak,
  } = useStudyStatistics()

  const dailyChartData = statistics.dailyTotals.map((total) => ({
    ...total,
    minutes: Number((total.totalSeconds / 60).toFixed(1)),
  }))
  const subjectChartData = statistics.subjectTotals.map((subject) => ({
    ...subject,
    minutes: Number((subject.totalSeconds / 60).toFixed(1)),
  }))
  const dailyGoalSeconds = settings.dailyGoalMinutes * 60
  const goalProgress =
    dailyGoalSeconds > 0
      ? Math.min(100, (statistics.todaySeconds / dailyGoalSeconds) * 100)
      : 0

  return (
    <section className="max-w-6xl">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Study statistics
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Your completed study time, calculated from raw study sessions in your
          browser&apos;s local timezone.
        </p>
      </div>

      {error ? (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100"
            onClick={() => void loadStatistics()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          Calculating your study statistics…
        </div>
      ) : statistics.completedSessionCount === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="font-semibold text-slate-900">
            No completed sessions yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Complete a study session to see your trends and insights here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Today"
              value={formatStudyDuration(statistics.todaySeconds)}
            />
            <SummaryCard
              label="This week"
              value={formatStudyDuration(statistics.weekSeconds)}
            />
            <SummaryCard
              label="This month"
              value={formatStudyDuration(statistics.monthSeconds)}
            />
            <SummaryCard
              label="This year"
              value={formatStudyDuration(statistics.yearSeconds)}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Daily goal
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Today&apos;s study time is measured against your saved goal of{' '}
                  {formatStudyDuration(dailyGoalSeconds)}.
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {goalProgress.toFixed(0)}%
              </p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                aria-label="Daily goal progress"
                className="h-full rounded-full bg-indigo-600 transition-[width]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {formatStudyDuration(
                Math.min(statistics.todaySeconds, dailyGoalSeconds),
              )}{' '}
              of {formatStudyDuration(dailyGoalSeconds)} completed today.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Daily study
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {statistics.rangeLabel}; zero-study days are included.
                </p>
              </div>
              <label className="text-sm font-medium text-slate-700">
                <span className="sr-only">Chart range</span>
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  onChange={(event) =>
                    setSelectedRange(event.target.value as StatisticsRange)
                  }
                  value={selectedRange}
                >
                  {ranges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={dailyChartData}
                  margin={{ left: -18, right: 8 }}
                >
                  <XAxis dataKey="label" tickLine={false} />
                  <YAxis
                    tickFormatter={(minutes) => `${minutes}m`}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    formatter={(minutes) => `${minutes} minutes`}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="minutes" fill="#6366F1" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Study by subject
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {statistics.rangeLabel} study time.
              </p>
              <ul className="mt-5 space-y-3">
                {statistics.subjectTotals.map((subject) => (
                  <li
                    className="flex items-center justify-between gap-4"
                    key={subject.subjectId}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="truncate font-medium text-slate-900">
                        {subject.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                      {formatStudyDuration(subject.totalSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Distribution
              </h2>
              <div className="mt-4 h-48">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(minutes) =>
                        formatChartMinutes(Number(minutes) * 60)
                      }
                    />
                    <Pie
                      data={subjectChartData}
                      dataKey="minutes"
                      innerRadius={42}
                      outerRadius={76}
                      paddingAngle={2}
                    >
                      {subjectChartData.map((subject) => (
                        <Cell fill={subject.color} key={subject.subjectId} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Session insights
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Completed sessions"
                value={statistics.completedSessionCount.toString()}
              />
              <SummaryCard
                label="Average session"
                value={formatStudyDuration(statistics.averageSessionSeconds)}
              />
              <SummaryCard
                label="Longest session"
                value={formatStudyDuration(statistics.longestSessionSeconds)}
              />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              All-time study: {formatStudyDuration(statistics.allTimeSeconds)}
            </p>
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Study streak
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  A day qualifies with at least {streak.minimumMinutes} minutes
                  of completed local study time.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="🔥 Current streak"
                value={`${streak.currentStreak} ${streak.currentStreak === 1 ? 'day' : 'days'}`}
              />
              <SummaryCard
                label="🏆 Longest streak"
                value={`${streak.longestStreak} ${streak.longestStreak === 1 ? 'day' : 'days'}`}
              />
              <SummaryCard
                label="🗓 Total study days"
                value={streak.totalStudyDays.toString()}
              />
            </div>
          </section>
        </>
      )}
    </section>
  )
}
