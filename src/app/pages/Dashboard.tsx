import { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import {
  Users,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  IdCard,
  Activity,
  Award,
  Sparkles,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

type DashboardStats = {
  totalInterns?: number;
  totalInternsChange?: string;
  pendingOnboarding?: number;
  pendingOnboardingChange?: string;
  ndaPending?: number;
  ndaPendingChange?: string;
  slaBreaches?: number;
  slaBreachesChange?: string;
  idsCreatedToday?: number;
  activeInternships?: number;
  certificatesPending?: number;
  aiAccuracyScore?: string;
};

type ChartPoint = {
  stage?: string;
  month?: string;
  name?: string;
  count?: number;
  interns?: number;
  value?: number;
  color?: string;
};

type DashboardActivity = {
  id?: string | number;
  message: string;
  time?: string;
  color?: string;
};

type DashboardInsight = {
  id?: string | number;
  message: string;
  severity?: 'warning' | 'error';
  action?: string;
};

type DashboardData = {
  stats?: DashboardStats;
  funnelData?: ChartPoint[];
  trendData?: ChartPoint[];
  departmentData?: ChartPoint[];
  timeline?: DashboardActivity[];
  aiInsights?: DashboardInsight[];
};

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    api.dashboard()
      .then((data) => {
        if (isMounted) setDashboard(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setDashboard(null);
        setErrorMessage(err instanceof Error ? err.message : 'Unable to load dashboard');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = dashboard?.stats || {};
  const funnelData = dashboard?.funnelData || [];
  const trendData = dashboard?.trendData || [];
  const departmentData = dashboard?.departmentData || [];
  const activities = dashboard?.timeline || [];
  const aiInsights = dashboard?.aiInsights || [];

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Loading the latest program overview...' : errorMessage || "Welcome back! Here's your program overview."}
          </p>
        </div>
        <Button variant="ai" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Interns"
          value={stats.totalInterns ?? 0}
          change={stats.totalInternsChange ?? 'No change data'}
          icon={Users}
          trend="up"
          color="bg-blue-500"
        />
        <MetricCard
          title="Pending Onboarding"
          value={stats.pendingOnboarding ?? 0}
          change={stats.pendingOnboardingChange ?? 'No due data'}
          icon={ClipboardCheck}
          trend="neutral"
          color="bg-purple-500"
        />
        <MetricCard
          title="NDA Pending"
          value={stats.ndaPending ?? 0}
          change={stats.ndaPendingChange ?? 'No overdue data'}
          icon={FileText}
          trend="down"
          color="bg-amber-500"
        />
        <MetricCard
          title="SLA Breaches"
          value={stats.slaBreaches ?? 0}
          change={stats.slaBreachesChange ?? 'No breach data'}
          icon={AlertTriangle}
          trend="up"
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">IDs Created Today</span>
              <Badge variant="success">{stats.idsCreatedToday ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Internships</span>
              <Badge variant="info">{stats.activeInternships ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Certificates Pending</span>
              <Badge variant="warning">{stats.certificatesPending ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Accuracy Score</span>
              <Badge variant="purple">{stats.aiAccuracyScore ?? '-'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Internship Lifecycle Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No funnel data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="interns" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No trend data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No department data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                (() => {
                  return (
                    <div key={activity.id || activity.message} className="flex items-start gap-3 pb-3 last:pb-0">
                      <div className={`mt-1 rounded-lg bg-opacity-10 p-2 ${(activity.color || 'text-blue-600').replace('text-', 'bg-')}`}>
                        <Activity className={`h-4 w-4 ${activity.color || 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  );
                })()
              ))}
              {!activities.length && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No workflow activity available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    {insight.severity === 'warning' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                    )}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 text-xs">
                    {insight.action}
                  </Button>
                </div>
              ))}
              {!aiInsights.length && (
                <div className="rounded-lg bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
                  No AI insights available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
