import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const slaData = [
  { department: 'Engineering', onTime: 45, delayed: 5 },
  { department: 'Design', onTime: 28, delayed: 2 },
  { department: 'Marketing', onTime: 35, delayed: 8 },
  { department: 'Product', onTime: 22, delayed: 3 },
  { department: 'Operations', onTime: 18, delayed: 1 },
];

const cycleTimeData = [
  { stage: 'Referral', avgDays: 0.5 },
  { stage: 'Screening', avgDays: 1.2 },
  { stage: 'NDA', avgDays: 1.8 },
  { stage: 'ID Creation', avgDays: 2.1 },
  { stage: 'Access', avgDays: 1.5 },
  { stage: 'Onboarding', avgDays: 3.2 },
];

const complianceData = [
  { name: 'NDA Complete', value: 95, color: '#10b981' },
  { name: 'Pending', value: 5, color: '#f59e0b' },
];

const monthlyTrend = [
  { month: 'Jan', interns: 45, slaBreaches: 3 },
  { month: 'Feb', interns: 52, slaBreaches: 5 },
  { month: 'Mar', interns: 61, slaBreaches: 4 },
  { month: 'Apr', interns: 73, slaBreaches: 2 },
  { month: 'May', interns: 89, slaBreaches: 3 },
];

const auditLogs = [
  {
    id: 1,
    timestamp: '2026-05-17 14:32:15',
    user: 'John Doe',
    action: 'Approved NDA',
    target: 'Sarah Chen',
    status: 'success',
  },
  {
    id: 2,
    timestamp: '2026-05-17 14:15:42',
    user: 'Lisa Smith',
    action: 'Created Non-Worker ID',
    target: 'Michael Rodriguez',
    status: 'success',
  },
  {
    id: 3,
    timestamp: '2026-05-17 13:58:33',
    user: 'Tom Johnson',
    action: 'Extended Internship',
    target: 'Emma Wilson',
    status: 'success',
  },
  {
    id: 4,
    timestamp: '2026-05-17 13:22:11',
    user: 'System',
    action: 'SLA Breach Alert',
    target: 'Alex Kumar',
    status: 'warning',
  },
  {
    id: 5,
    timestamp: '2026-05-17 12:45:08',
    user: 'Mike Wilson',
    action: 'Issued Certificate',
    target: 'Jordan Lee',
    status: 'success',
  },
];

export function Reports() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprehensive insights and compliance reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="primary">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interns</p>
                <p className="mt-1 text-2xl font-bold">520</p>
                <p className="mt-1 text-xs text-emerald-600">+12% vs last period</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="mt-1 text-2xl font-bold">94.2%</p>
                <p className="mt-1 text-xs text-emerald-600">+2.3% improvement</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Cycle Time</p>
                <p className="mt-1 text-2xl font-bold">8.3 days</p>
                <p className="mt-1 text-xs text-amber-600">-1.2 days faster</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className="mt-1 text-2xl font-bold">17</p>
                <p className="mt-1 text-xs text-red-600">3 this week</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SLA Performance by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={slaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTime" fill="#10b981" name="On Time" radius={[8, 8, 0, 0]} />
                <Bar dataKey="delayed" fill="#f59e0b" name="Delayed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Cycle Time by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cycleTimeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="avgDays" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Intern Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="interns"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="New Interns"
                />
                <Line
                  type="monotone"
                  dataKey="slaBreaches"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="SLA Breaches"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NDA Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Target</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="text-sm">
                    <td className="py-3 text-muted-foreground">{log.timestamp}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {log.user.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{log.user}</span>
                      </div>
                    </td>
                    <td className="py-3">{log.action}</td>
                    <td className="py-3">{log.target}</td>
                    <td className="py-3">
                      {log.status === 'success' ? (
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Warning
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-blue-100">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white">
                  <span className="text-3xl font-bold text-emerald-600">94%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Overall compliance with internship program policies
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Background Checks</span>
              <Badge variant="success">100%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">NDA Completion</span>
              <Badge variant="success">95%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ID Provisioning</span>
              <Badge variant="success">98%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Access Control</span>
              <Badge variant="success">97%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              SLA Performance Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Compliance Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Audit Trail Export
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Executive Summary
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
