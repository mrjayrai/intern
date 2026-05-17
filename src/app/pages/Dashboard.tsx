import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  IdCard,
  Activity,
  Award,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const funnelData = [
  { stage: 'Referrals', count: 450 },
  { stage: 'Screening', count: 320 },
  { stage: 'Onboarding', count: 180 },
  { stage: 'Active', count: 145 },
  { stage: 'Completed', count: 89 },
];

const trendData = [
  { month: 'Jan', interns: 45 },
  { month: 'Feb', interns: 52 },
  { month: 'Mar', interns: 61 },
  { month: 'Apr', interns: 73 },
  { month: 'May', interns: 89 },
];

const departmentData = [
  { name: 'Engineering', value: 45, color: '#3b82f6' },
  { name: 'Marketing', value: 28, color: '#10b981' },
  { name: 'Design', value: 18, color: '#8b5cf6' },
  { name: 'Product', value: 22, color: '#f59e0b' },
  { name: 'Operations', value: 12, color: '#ec4899' },
];

const activities = [
  { id: 1, type: 'referral', message: 'New referral submitted by Sarah Chen', time: '2 minutes ago', icon: Users, color: 'text-blue-600' },
  { id: 2, type: 'nda', message: 'NDA signed by Michael Rodriguez', time: '15 minutes ago', icon: FileText, color: 'text-green-600' },
  { id: 3, type: 'id', message: 'AD account created for Emma Wilson', time: '1 hour ago', icon: IdCard, color: 'text-purple-600' },
  { id: 4, type: 'extension', message: 'Internship extended for Alex Kumar', time: '2 hours ago', icon: Activity, color: 'text-amber-600' },
  { id: 5, type: 'certificate', message: 'Certificate issued to Jordan Lee', time: '3 hours ago', icon: Award, color: 'text-emerald-600' },
];

const aiInsights = [
  { id: 1, message: '3 interns may miss onboarding SLA deadline', severity: 'warning', action: 'View Details' },
  { id: 2, message: 'Duplicate candidate detected: John Smith', severity: 'error', action: 'Review' },
  { id: 3, message: 'Mentor response delayed for 2 candidates', severity: 'warning', action: 'Send Reminder' },
  { id: 4, message: 'Missing government ID for 1 candidate', severity: 'error', action: 'Request Document' },
];

export function Dashboard() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back! Here's your program overview.</p>
        </div>
        <Button variant="ai" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Interns"
          value="145"
          change="+12% from last month"
          icon={Users}
          trend="up"
          color="bg-blue-500"
        />
        <MetricCard
          title="Pending Onboarding"
          value="23"
          change="5 due today"
          icon={ClipboardCheck}
          trend="neutral"
          color="bg-purple-500"
        />
        <MetricCard
          title="NDA Pending"
          value="8"
          change="2 overdue"
          icon={FileText}
          trend="down"
          color="bg-amber-500"
        />
        <MetricCard
          title="SLA Breaches"
          value="3"
          change="-2 from yesterday"
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
              <Badge variant="success">12</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Internships</span>
              <Badge variant="info">145</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Certificates Pending</span>
              <Badge variant="warning">7</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Accuracy Score</span>
              <Badge variant="purple">98.5%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Internship Lifecycle Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="interns" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                <div key={activity.id} className="flex items-start gap-3 pb-3 last:pb-0">
                  <div className={`mt-1 rounded-lg bg-opacity-10 p-2 ${activity.color.replace('text-', 'bg-')}`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
