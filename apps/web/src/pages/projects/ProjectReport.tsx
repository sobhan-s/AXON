import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Clock,
  CheckSquare,
  AlertCircle,
  Download,
  Users,
  FileText,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { ANALYTICS_ENDPOINT } from '@/lib/api-endpints';
import { StatCard } from '@/components/Stats';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Loader } from '@/components/Loader';
import { fmt, fmtBytes } from '@/helper/formatByte';
import { shortDate, defaultRange } from '@/helper/DateHelper';
import { STATUS_COLOR, PRIORITY_COLOR, SERIES } from '@/constants/colors';
import { type DateRange } from '@/interfaces/ProjectReport';

const api = axios.create({ withCredentials: true });

export function ProjectReportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.name ?? '';

  const [range, setRange] = useState<DateRange>(defaultRange());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rLoading, setRLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        ANALYTICS_ENDPOINT.PROJECT_ANALYTICS(Number(projectId)),
        {
          params: { from: range.from, to: range.to },
        },
      );
      setData(res.data.data);
    } catch {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId, range]);

  useEffect(() => {
    load();
  }, [load]);

  const sendReport = async () => {
    if (!user?.email || !projectId) return;
    setRLoading(true);
    try {
      await api.post(
        `${ANALYTICS_ENDPOINT.REPORT_PROJECT(Number(projectId))}?from=${range.from}&to=${range.to}`,
        { email: user.email },
      );
      alert(`Report will be sent to ${user.email}`);
    } catch {
      alert('Failed to send report. Please try again.');
    } finally {
      setRLoading(false);
    }
  };

  const taskStatusData = data
    ? Object.entries(data.tasks?.byStatus ?? {}).map(([name, count]) => ({
        name,
        value: count as number,
        fill: STATUS_COLOR[name] ?? SERIES[0],
      }))
    : [];

  const taskPriorityData = data
    ? Object.entries(data.tasks?.byPriority ?? {}).map(([name, count]) => ({
        name,
        value: count as number,
        fill: PRIORITY_COLOR[name] ?? SERIES[0],
      }))
    : [];

  const uploadTrend = (data?.assets?.uploadsByDay ?? []).map((d: any) => ({
    date: shortDate(d.date),
    uploads: d.count ?? 0,
  }));

  const assetByType = (data?.assets?.byType ?? []).map((a: any, i: number) => ({
    name: a.fileType,
    value: a.count ?? 0,
    fill: SERIES[i % SERIES.length],
  }));

  const hoursByDay = (data?.timeLogs?.byDay ?? []).map((d: any) => ({
    date: shortDate(d.date),
    hours: d.hours ?? 0,
  }));

  const hoursByMember = (data?.timeLogs?.byMember ?? []).map(
    (m: any, i: number) => ({
      name: m.username,
      hours: m.hours ?? 0,
      fill: SERIES[i % SERIES.length],
    }),
  );

  const memberRows = data?.members ?? [];
  const recentUploads = data?.assets?.recentUploads ?? [];

  const taskStatusCfg = Object.fromEntries(
    taskStatusData.map((t: any) => [t.name, { label: t.name, color: t.fill }]),
  );
  const taskPriorityCfg = Object.fromEntries(
    taskPriorityData.map((t: any) => [
      t.name,
      { label: t.name, color: t.fill },
    ]),
  );
  const assetTypeCfg = Object.fromEntries(
    assetByType.map((a: any) => [a.name, { label: a.name, color: a.fill }]),
  );
  const memberHoursCfg = Object.fromEntries(
    hoursByMember.map((m: any) => [m.name, { label: m.name, color: m.fill }]),
  );

  const completionRate = data?.tasks?.completionRate ?? 0;
  const approvalRate = data?.approvals?.approvalRate ?? 0;

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {data?.project?.name ?? 'Project'} Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analytics, time tracking, and asset insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          {['ADMIN', 'MANAGER', 'LEAD'].includes(role) && (
            <Button
              size="sm"
              variant="outline"
              onClick={sendReport}
              disabled={rLoading}
              className="gap-1.5 text-xs h-8"
            >
              <Download className="h-3.5 w-3.5" />
              {rLoading ? 'Sending . . .' : 'Email Report'}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {loading && <Loader />}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 rounded-xl border">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={CheckSquare}
              label="Total Tasks"
              value={fmt(data.tasks?.total)}
              sub={`${data.tasks?.byStatus?.DONE ?? 0} done`}
              iconClass="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Completion Rate"
              value={`${completionRate}%`}
              progress={completionRate}
              iconClass="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={AlertCircle}
              label="Overdue Tasks"
              value={fmt(data.tasks?.overdue)}
              iconClass="bg-red-100 text-red-600"
            />
            <StatCard
              icon={ThumbsUp}
              label="Approval Rate"
              value={`${approvalRate}%`}
              progress={approvalRate}
              iconClass="bg-violet-100 text-violet-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Clock}
              label="Hours Logged"
              value={data.timeLogs?.totalHours ?? 0}
              sub={`est. ${data.timeLogs?.estimatedHours ?? 0}h`}
              iconClass="bg-orange-100 text-orange-600"
            />
            <StatCard
              icon={Users}
              label="Members"
              value={memberRows.length}
              iconClass="bg-sky-100 text-sky-600"
            />
            <StatCard
              icon={FileText}
              label="Total Assets"
              value={fmt(data.assets?.total)}
              sub={fmtBytes(data.assets?.totalSize ?? 0)}
              iconClass="bg-purple-100 text-purple-600"
            />
            <StatCard
              icon={CheckSquare}
              label="Finalized Assets"
              value={fmt(data.assets?.finalized?.total)}
              iconClass="bg-emerald-100 text-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Upload Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily asset uploads over selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-2">
                <ChartContainer
                  config={{ uploads: { label: 'Uploads', color: SERIES[0] } }}
                  className="h-[200px] w-full"
                >
                  <AreaChart
                    data={uploadTrend}
                    margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={SERIES[0]}
                          stopOpacity={0.12}
                        />
                        <stop
                          offset="95%"
                          stopColor={SERIES[0]}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="uploads"
                      stroke={SERIES[0]}
                      fill="url(#gUp)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Assets by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-0">
                <ChartContainer
                  config={assetTypeCfg}
                  className="h-[200px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={assetByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {assetByType.map((_: any, i: number) => (
                        <Cell key={i} fill={SERIES[i % SERIES.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Tasks by Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-2">
                <ChartContainer
                  config={taskStatusCfg}
                  className="h-[180px] w-full"
                >
                  <BarChart
                    data={taskStatusData}
                    barSize={28}
                    margin={{ left: 0, right: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {taskStatusData.map((t: any, i: number) => (
                        <Cell key={i} fill={t.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Tasks by Priority
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-2">
                <ChartContainer
                  config={taskPriorityCfg}
                  className="h-[180px] w-full"
                >
                  <BarChart
                    data={taskPriorityData}
                    barSize={28}
                    margin={{ left: 0, right: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {taskPriorityData.map((t: any, i: number) => (
                        <Cell key={i} fill={t.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Hours by Day
                </CardTitle>
                <CardDescription className="text-xs">
                  Total: {data.timeLogs?.totalHours ?? 0}h logged · Est:{' '}
                  {data.timeLogs?.estimatedHours ?? 0}h
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-2">
                <ChartContainer
                  config={{ hours: { label: 'Hours', color: SERIES[4] } }}
                  className="h-[180px] w-full"
                >
                  <BarChart
                    data={hoursByDay}
                    barSize={14}
                    margin={{ left: 0, right: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 9,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 9,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="hours"
                      fill={SERIES[4]}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Hours by Member
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-2">
                <ChartContainer
                  config={memberHoursCfg}
                  className="h-[180px] w-full"
                >
                  <BarChart
                    data={hoursByMember}
                    barSize={22}
                    margin={{ left: 0, right: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 9,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 9,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                      {hoursByMember.map((_: any, i: number) => (
                        <Cell key={i} fill={SERIES[i % SERIES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-none">
            <CardHeader className="px-5 pb-0 pt-5">
              <CardTitle className="text-sm font-medium">Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  {
                    label: 'Total',
                    value: data.approvals?.total ?? 0,
                    color: 'text-foreground',
                  },
                  {
                    label: 'Pending',
                    value: data.approvals?.pending ?? 0,
                    color: 'text-yellow-600',
                  },
                  {
                    label: 'Approved',
                    value: data.approvals?.approved ?? 0,
                    color: 'text-emerald-600',
                  },
                  {
                    label: 'Rejected',
                    value: data.approvals?.rejected ?? 0,
                    color: 'text-red-600',
                  },
                  {
                    label: 'Rate',
                    value: `${approvalRate}%`,
                    color: 'text-blue-600',
                  },
                  {
                    label: 'Avg Review',
                    value:
                      data.approvals?.avgReviewHours != null
                        ? `${data.approvals.avgReviewHours}h`
                        : ' ',
                    color: 'text-purple-600',
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 border-r last:border-r-0 pr-4 last:pr-0"
                  >
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                    <span className={`text-xl font-bold tabular-nums ${color}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="px-5 pb-0 pt-5">
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5 text-xs">Member</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Tasks</TableHead>
                    <TableHead className="text-xs">Done</TableHead>
                    <TableHead className="text-xs">Hours</TableHead>
                    <TableHead className="pr-5 text-xs">Assets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No members
                      </TableCell>
                    </TableRow>
                  )}
                  {memberRows.map((m: any) => (
                    <TableRow key={m.id} className="hover:bg-muted/40">
                      <TableCell className="pl-5 font-medium text-sm">
                        {m.username}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-sm text-xs font-normal"
                        >
                          {m.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm text-muted-foreground">
                        {m.tasks?.total ?? 0}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm text-muted-foreground">
                        {m.tasks?.done ?? 0}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm text-muted-foreground">
                        {m.hoursLogged ?? 0}h
                      </TableCell>
                      <TableCell className="pr-5 tabular-nums text-sm text-muted-foreground">
                        {m.assetsUploaded ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {recentUploads.length > 0 && (
            <Card className="shadow-none">
              <CardHeader className="px-5 pb-0 pt-5">
                <CardTitle className="text-sm font-medium">
                  Recent Uploads
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 text-xs">File</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Size</TableHead>
                      <TableHead className="text-xs">Uploaded by</TableHead>
                      <TableHead className="pr-5 text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUploads.slice(0, 10).map((a: any) => (
                      <TableRow key={a.id} className="hover:bg-muted/40">
                        <TableCell className="pl-5 font-medium text-sm max-w-[200px] truncate">
                          {a.originalName ?? a.filename}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="rounded-sm text-xs font-normal"
                          >
                            {a.fileType}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm text-muted-foreground">
                          {fmtBytes(a.fileSize ?? 0)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.uploadedBy ?? ' '}
                        </TableCell>
                        <TableCell className="pr-5 text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default ProjectReportsPage;
