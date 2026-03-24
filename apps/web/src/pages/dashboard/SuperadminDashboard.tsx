import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { ANALYTICS_ENDPOINT } from '@/lib/api-endpints';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Users,
  FolderOpen,
  CheckSquare,
  HardDrive,
  FileText,
  Clock,
  Building2,
  Download,
} from 'lucide-react';
import { type DateRange } from '@/interfaces/ProjectReport';
import {
  STATUS_COLOR,
  PRIORITY_COLOR,
  SERIES as SERIES_COLORS,
} from '@/constants/colors';
import { fmt, fmtBytes } from '@/helper/formatByte';
import { Loader } from '@/components/Loader';
import { shortDate, defaultRange } from '@/helper/DateHelper';
import { DateRangePicker } from '@/components/DateRangePicker';
import { StatCard as KpiCard } from '@/components/Stats';

const api = axios.create({ withCredentials: true });

async function fetchAnalytics(url: string, range: DateRange) {
  const res = await api.get(url, {
    params: { from: range.from, to: range.to },
  });
  return res.data.data;
}

async function requestReport(url: string, email: string, range: DateRange) {
  await api.post(`${url}?from=${range.from}&to=${range.to}`, { email });
}

function PageHeader({
  title,
  subtitle,
  range,
  onRangeChange,
  onReport,
  reportLoading,
  extra,
}: {
  title: string;
  subtitle: string;
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  onReport?: () => void;
  reportLoading?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <DateRangePicker value={range} onChange={onRangeChange} />
        {onReport && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReport}
            disabled={reportLoading}
            className="gap-1.5 text-xs h-8"
          >
            <Download className="h-3.5 w-3.5" />
            {reportLoading ? 'Sending…' : 'Email Report'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<DateRange>(defaultRange());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rLoading, setRLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await fetchAnalytics(ANALYTICS_ENDPOINT.PLATFORM_ANALYTICS, range),
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const sendReport = async () => {
    if (!user?.email) return;
    setRLoading(true);
    try {
      await requestReport(
        ANALYTICS_ENDPOINT.REPORT_PLATFORM,
        user.email,
        range,
      );
      alert(`Report will be sent to ${user.email}`);
    } finally {
      setRLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  if (!data) return null;

  const ov = data.overview ?? {};

  const taskStatusData = (data.tasks?.byStatus ?? []).map((t: any) => ({
    name: t.status,
    value: t._count?.id ?? t.count ?? 0,
    fill: STATUS_COLOR[t.status] ?? SERIES_COLORS[0],
  }));
  const taskPriorityData = (data.tasks?.byPriority ?? []).map((t: any) => ({
    name: t.priority,
    value: t._count?.id ?? t.count ?? 0,
    fill: PRIORITY_COLOR[t.priority] ?? SERIES_COLORS[0],
  }));
  const uploadTrend = (data.assets?.uploadsByDay ?? []).map((d: any) => ({
    date: shortDate(d.date),
    uploads: d.count ?? 0,
  }));
  const approvalData = (data.approvals?.byStatus ?? []).map(
    (a: any, i: number) => ({
      name: a.status,
      value: a._count?.id ?? a.count ?? 0,
      fill: SERIES_COLORS[i % SERIES_COLORS.length],
    }),
  );
  const orgRows = data.orgs ?? [];
  const storagePercent = ov.storage?.limitBytes
    ? Math.round((ov.storage.usedBytes / ov.storage.limitBytes) * 100)
    : 0;

  const taskStatusCfg = Object.fromEntries(
    taskStatusData.map((t: any) => [t.name, { label: t.name, color: t.fill }]),
  );
  const taskPriorityCfg = Object.fromEntries(
    taskPriorityData.map((t: any) => [
      t.name,
      { label: t.name, color: t.fill },
    ]),
  );
  const approvalCfg = Object.fromEntries(
    approvalData.map((a: any) => [a.name, { label: a.name, color: a.fill }]),
  );

  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <PageHeader
        title="Platform Overview"
        subtitle="All organizations · All activity"
        range={range}
        onRangeChange={setRange}
        onReport={sendReport}
        reportLoading={rLoading}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Organizations"
          icon={Building2}
          value={fmt(ov.orgs?.total ?? 0)}
          sub={`${ov.orgs?.active ?? 0} active`}
        />
        <KpiCard
          label="Users"
          icon={Users}
          value={fmt(ov.users?.total ?? 0)}
          sub={`+${ov.users?.newInRange ?? 0} this period`}
        />
        <KpiCard
          label="Projects"
          icon={FolderOpen}
          value={fmt(ov.projects?.total ?? 0)}
          sub={`${ov.projects?.active ?? 0} active`}
        />
        <KpiCard
          label="Total Tasks"
          icon={CheckSquare}
          value={fmt(ov.tasks?.total ?? 0)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total Assets"
          icon={FileText}
          value={fmt(ov.assets?.total ?? 0)}
          sub={fmtBytes(ov.assets?.totalSize ?? 0)}
        />
        <KpiCard
          label="Storage Used"
          icon={HardDrive}
          value={fmtBytes(ov.storage?.usedBytes ?? 0)}
          sub={`of ${fmtBytes(ov.storage?.limitBytes ?? 0)}`}
          progress={storagePercent}
        />
        <KpiCard
          label="Hours Logged"
          icon={Clock}
          value={ov.hoursLogged ?? 0}
        />
        <KpiCard
          label="Total Approvals"
          icon={CheckSquare}
          value={fmt(
            approvalData.reduce((s: number, a: any) => s + a.value, 0),
          )}
        />
      </div>

      {/* Upload trend + Approvals donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader className="px-5 pb-0 pt-5">
            <CardTitle className="text-sm font-medium">
              Asset Upload Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Daily uploads over selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 pt-2">
            <ChartContainer
              config={{
                uploads: { label: 'Uploads', color: SERIES_COLORS[0] },
              }}
              className="h-[200px] w-full"
            >
              <AreaChart
                data={uploadTrend}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={SERIES_COLORS[0]}
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="95%"
                      stopColor={SERIES_COLORS[0]}
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
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  stroke={SERIES_COLORS[0]}
                  fill="url(#gUploads)"
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
              Approval Status
            </CardTitle>
            <CardDescription className="text-xs">
              All approvals breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 pt-0">
            <ChartContainer config={approvalCfg} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={approvalData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {approvalData.map((a: any, i: number) => (
                    <Cell key={i} fill={a.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="px-5 pb-0 pt-5">
            <CardTitle className="text-sm font-medium">
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4 pt-2">
            <ChartContainer config={taskStatusCfg} className="h-[180px] w-full">
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
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
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
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
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

      {/* Organizations table */}
      <Card className="shadow-none">
        <CardHeader className="px-5 pb-0 pt-5">
          <CardTitle className="text-sm font-medium">Organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs">Name</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Members</TableHead>
                <TableHead className="text-xs">Projects</TableHead>
                <TableHead className="text-xs w-40">Storage</TableHead>
                <TableHead className="pr-5 text-xs">Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No organizations
                  </TableCell>
                </TableRow>
              )}
              {orgRows.map((o: any) => (
                <TableRow key={o.id} className="hover:bg-muted/40">
                  <TableCell className="pl-5 font-medium text-sm">
                    {o.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={o.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="rounded-sm text-xs font-normal"
                    >
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-sm text-muted-foreground">
                    {o.members}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm text-muted-foreground">
                    {o.projects}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={o.storagePercent ?? 0}
                        className="h-1 w-20"
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {o.storagePercent ?? 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-5 tabular-nums text-sm text-muted-foreground">
                    {fmtBytes(o.storageUsed ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity */}
      {(data.activity?.recent ?? []).length > 0 && (
        <Card className="shadow-none">
          <CardHeader className="px-5 pb-0 pt-5">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 text-xs">Action</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="pr-5 text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activity.recent.slice(0, 10).map((l: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/40">
                    <TableCell className="pl-5 text-sm capitalize">
                      {l.action.replace(/_/g, ' ').toLowerCase()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.user?.username ?? '—'}
                    </TableCell>
                    <TableCell className="pr-5 text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
