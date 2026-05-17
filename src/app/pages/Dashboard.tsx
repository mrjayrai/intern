import { useCallback, useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { api } from '../lib/api';
import {
  Activity,
  AlertTriangle,
  Award,
  ClipboardCheck,
  FileText,
  RefreshCcw,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardStats = {
  totalReferrals?: number;
  totalInterns?: number;
  pendingOnboarding?: number;
  ndaPending?: number;
  slaBreaches?: number;
  activeInternships?: number;
  certificatesIssued?: number;
  certificatesPending?: number;
};

type FunnelPoint = {
  stage: string;
  count: number;
};

type TrendPoint = {
  month: string;
  referrals?: number;
  interns?: number;
};

type DepartmentPoint = {
  name: string;
  value: number;
  color?: string;
};

type ActivityItem = {
  id?: string;
  message: string;
  time?: string;
  performedBy?: string;
  resourceType?: string;
};

type SlaAlert = {
  id?: string;
  message: string;
  severity?: 'warning' | 'error';
  action?: string;
};

type DashboardData = {
  stats?: DashboardStats;
  funnelData?: FunnelPoint[];
  trendData?: TrendPoint[];
  departmentData?: DepartmentPoint[];
  timeline?: ActivityItem[];
  slaAlerts?: SlaAlert[];
};

const stageLabels: Record<string, string> = {
  REFERRED: 'Referred',
  HR_REVIEW: 'HR Review',
  JOINING_FORM_PENDING: 'Joining Form',
  NDA_PENDING: 'NDA Pending',
  NON_WORKER_ID_PENDING: 'ID Pending',
  ACCESS_PROVISIONING: 'Access',
  READY_TO_START: 'Ready',
  ACTIVE: 'Active',
  EXTENSION_REQUESTED: 'Extension',
  COMPLETED: 'Completed',
  CERTIFICATE_PENDING: 'Certificate Pending',
  CERTIFICATE_ISSUED: 'Certificate Issued',
  CLOSED: 'Closed',
};

const chartColors = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

function formatStage(stage: string) {
  return stageLabels[stage] || stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg xl:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await api.dashboard<DashboardData>();
      setDashboard(data);
    } catch (err) {
      setDashboard(null);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = dashboard?.stats || {};
  const funnelData = (dashboard?.funnelData || []).map((item) => ({
    ...item,
    stageLabel: formatStage(item.stage),
  }));
  const trendData = dashboard?.trendData || [];
  const departmentData = dashboard?.departmentData || [];
  const activities = dashboard?.timeline || [];
  const slaAlerts = dashboard?.slaAlerts || [];

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time internship workflow, SLA, and activity overview.
          </p>
        </div>
        <Button variant="outline" className="gap-2 self-start" onClick={loadDashboard}>
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Dashboard could not be loaded</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
            <Button variant="outline" onClick={loadDashboard}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Referrals" value={stats.totalReferrals ?? 0} change="Live from referrals" icon={Users} trend="neutral" color="bg-blue-500" />
        <MetricCard title="Pending Onboarding" value={stats.pendingOnboarding ?? 0} change="Workflow queue" icon={ClipboardCheck} trend="neutral" color="bg-purple-500" />
        <MetricCard title="NDA Pending" value={stats.ndaPending ?? 0} change="Awaiting documents" icon={FileText} trend="neutral" color="bg-amber-500" />
        <MetricCard title="SLA Breaches" value={stats.slaBreaches ?? 0} change="Needs attention" icon={AlertTriangle} trend={(stats.slaBreaches ?? 0) > 0 ? 'down' : 'neutral'} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Internships</span>
              <Badge variant="info">{stats.activeInternships ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Certificates Issued</span>
              <Badge variant="success">{stats.certificatesIssued ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Certificates Pending</span>
              <Badge variant="warning">{stats.certificatesPending ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Interns</span>
              <Badge variant="purple">{stats.totalInterns ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Workflow Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stageLabel" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="No workflow data available." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Referral Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="referrals" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="No monthly trend data available." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {slaAlerts.length ? (
              <div className="space-y-3">
                {slaAlerts.map((alert) => (
                  <div key={alert.id || alert.message} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div className="flex items-start gap-3">
                      {alert.severity === 'error' ? (
                        <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                      )}
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                    {alert.action && (
                      <Badge variant={alert.severity === 'error' ? 'error' : 'warning'}>{alert.action}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel message="No active SLA alerts." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id || activity.message} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                    <div className="mt-1 rounded-md bg-blue-50 p-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {[activity.performedBy, formatTime(activity.time)].filter(Boolean).join(' - ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel message="No recent activity." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>Department Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {departmentData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" dataKey="value" outerRadius={88} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {departmentData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color || chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground">
                <Award className="h-5 w-5" />
                Department data is not available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
