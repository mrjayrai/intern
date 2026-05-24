import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileDown,
  RefreshCcw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/skeleton';
import { MetricCard } from '../components/MetricCard';
import {
  api,
  type CompletionMetrics,
  type OnboardingFunnelPoint,
  type OverviewMetrics,
  type ReferralConversionMetrics,
  type ReportFilters,
  type SlaMetrics,
  type TimelineTrendPoint,
  type WorkflowBottleneckPoint,
} from '../lib/api';

type ReportsState = {
  overview: OverviewMetrics | null;
  funnel: OnboardingFunnelPoint[];
  conversion: ReferralConversionMetrics | null;
  sla: SlaMetrics | null;
  bottlenecks: WorkflowBottleneckPoint[];
  completion: CompletionMetrics | null;
  trends: TimelineTrendPoint[];
};

const emptyState: ReportsState = {
  overview: null,
  funnel: [],
  conversion: null,
  sla: null,
  bottlenecks: [],
  completion: null,
  trends: [],
};

const stageLabels: Record<string, string> = {
  REFERRED: 'Referred',
  JOINING_FORM_PENDING: 'Joining Form',
  NON_WORKER_ID_PENDING: 'ID Pending',
  NDA_PENDING: 'NDA Pending',
  ACCESS_PROVISIONING: 'Access',
  READY_TO_START: 'Ready',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CERTIFICATE_ISSUED: 'Certified',
  CLOSED: 'Closed',
};

const chartPalette = ['#1d4ed8', '#0f766e', '#d97706', '#dc2626', '#475569', '#0891b2', '#65a30d'];

function formatStage(stage: string) {
  return stageLabels[stage] || stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-lg" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-lg xl:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export function Reports() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    department: '',
    workflowStage: '',
  });
  const [reports, setReports] = useState<ReportsState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value),
    ) as ReportFilters;

    try {
      const [overview, onboarding, referrals, sla, workflows, timeline] = await Promise.all([
        api.reports.overview(params),
        api.reports.onboarding(params),
        api.reports.referrals(params),
        api.reports.sla(params),
        api.reports.workflows(params),
        api.reports.timeline({ ...params, granularity: 'month' }),
      ]);

      setReports({
        overview: overview.metrics,
        funnel: onboarding.funnel,
        conversion: referrals.conversion,
        sla: sla.metrics,
        bottlenecks: workflows.bottlenecks,
        completion: workflows.completion,
        trends: timeline.trends,
      });
    } catch (err) {
      setReports(emptyState);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const referralOptions = useMemo(() => reports.funnel.map((item) => ({
    ...item,
    label: formatStage(item.stage),
  })), [reports.funnel]);

  const trendData = useMemo(() => {
    return reports.trends.map((item) => ({
      period: item._id?.month ? `${item._id.month}/${item._id.year}` : `${item._id?.week || item._id?.day || ''}/${item._id?.year || ''}`,
      referrals: item.referrals,
      completed: item.completed,
      breaches: reports.sla?.breached || 0,
    }));
  }, [reports.trends, reports.sla?.breached]);

  const completionData = useMemo(() => {
    if (!reports.completion) return [];
    return [
      { name: 'Completed', value: reports.completion.completed, color: '#0f766e' },
      { name: 'Active', value: reports.completion.active, color: '#1d4ed8' },
      { name: 'Terminated', value: reports.completion.terminated, color: '#dc2626' },
    ];
  }, [reports.completion]);

  const workflowStageOptions = useMemo(() => {
    return Array.from(new Set(reports.funnel.map((item) => item.stage)));
  }, [reports.funnel]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(format);

    const params = {
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      reportType: format === 'csv' ? 'overview' : 'workflows',
    } as ReportFilters & { reportType: string };

    try {
      const blob = format === 'csv' ? await api.reports.exportCsv(params) : await api.reports.exportPdf(params);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `intern-flow-reports.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : `Unable to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  const overview = reports.overview;
  const conversion = reports.conversion;
  const sla = reports.sla;
  const completion = reports.completion;
  const averageWorkflowDays = reports.bottlenecks.length
    ? Math.round((reports.bottlenecks.reduce((sum, item) => sum + item.avgDaysInStage, 0) / reports.bottlenecks.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            API-driven analytics across onboarding, referrals, workflow completion, and SLA performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadReports}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={isExporting !== null}>
            <Download className="h-4 w-4" />
            {isExporting === 'csv' ? 'Exporting CSV' : 'Export CSV'}
          </Button>
          <Button variant="primary" onClick={() => handleExport('pdf')} disabled={isExporting !== null}>
            <FileDown className="h-4 w-4" />
            {isExporting === 'pdf' ? 'Exporting PDF' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Reports could not be loaded</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
            <Button variant="outline" onClick={loadReports}>Try again</Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input type="date" value={filters.startDate || ''} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
          <Input type="date" value={filters.endDate || ''} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
          <Input placeholder="Department" value={filters.department || ''} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))} />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={filters.workflowStage || ''}
            onChange={(event) => setFilters((current) => ({ ...current, workflowStage: event.target.value }))}
          >
            <option value="">All workflow stages</option>
            {workflowStageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {formatStage(stage)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active interns" value={overview?.activeInternships || 0} icon={Users} color="bg-blue-500" />
        <MetricCard title="Onboarding completion rate" value={`${completion?.completionRate || 0}%`} icon={CheckCircle} color="bg-emerald-500" />
        <MetricCard title="SLA compliance" value={`${sla?.complianceRate || 0}%`} icon={TrendingUp} color="bg-cyan-500" />
        <MetricCard title="Workflow completion time" value={`${averageWorkflowDays} days`} icon={Clock} color="bg-amber-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={referralOptions} isAnimationActive>
                  {referralOptions.map((item, index) => (
                    <Cell key={item.stage} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="referrals" stroke="#1d4ed8" strokeWidth={2} name="Referrals" />
                <Line type="monotone" dataKey="completed" stroke="#0f766e" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>SLA breaches</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={[
                  { name: 'On time', value: sla?.onTime || 0 },
                  { name: 'Breached', value: sla?.breached || 0 },
                  { name: 'Completed', value: sla?.completed || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {['#0f766e', '#dc2626', '#1d4ed8'].map((color) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={completionData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {completionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workflow bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={reports.bottlenecks.map((item) => ({ ...item, stageLabel: formatStage(item.stage) }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="stageLabel" type="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avgDaysInStage" fill="#d97706" radius={[0, 8, 8, 0]} name="Avg days in stage" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Referral conversion</p>
              <p className="mt-2 text-2xl font-semibold">{conversion?.conversionRate || 0}%</p>
              <p className="mt-1 text-sm text-muted-foreground">{conversion?.converted || 0} converted from {conversion?.total || 0} referrals</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SLA breaches</span>
                <Badge variant={(sla?.breached || 0) > 0 ? 'error' : 'success'}>{sla?.breached || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Certificates issued</span>
                <Badge variant="info">{completion?.certificateIssued || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rejected referrals</span>
                <Badge variant="warning">{conversion?.rejected || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed interns</span>
                <Badge variant="success">{completion?.completed || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
