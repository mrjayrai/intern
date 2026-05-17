import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  IdCard,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Building,
  Shield,
  Download
} from 'lucide-react';
import { useState } from 'react';

const idRequests = [
  {
    id: 1,
    candidateName: 'Sarah Chen',
    department: 'Engineering',
    requestDate: '2026-05-14',
    status: 'approved',
    priority: 'high',
    sla: 'On time',
    idNumber: 'NW-2026-001234',
    approver: 'John Doe',
  },
  {
    id: 2,
    candidateName: 'Michael Rodriguez',
    department: 'Design',
    requestDate: '2026-05-15',
    status: 'pending_approval',
    priority: 'medium',
    sla: '4 hours left',
    idNumber: null,
    approver: 'Pending',
  },
  {
    id: 3,
    candidateName: 'Emma Wilson',
    department: 'Marketing',
    requestDate: '2026-05-13',
    status: 'in_progress',
    priority: 'high',
    sla: '2 hours left',
    idNumber: 'NW-2026-001235',
    approver: 'Lisa Smith',
  },
  {
    id: 4,
    candidateName: 'Alex Kumar',
    department: 'Engineering',
    requestDate: '2026-05-12',
    status: 'overdue',
    priority: 'critical',
    sla: 'Overdue 6h',
    idNumber: null,
    approver: 'Pending',
  },
  {
    id: 5,
    candidateName: 'Jordan Lee',
    department: 'Product',
    requestDate: '2026-05-16',
    status: 'completed',
    priority: 'low',
    sla: 'Completed',
    idNumber: 'NW-2026-001236',
    approver: 'John Doe',
  },
];

const statusConfig = {
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  pending_approval: { label: 'Pending Approval', variant: 'warning' as const, icon: Clock },
  in_progress: { label: 'In Progress', variant: 'info' as const, icon: Clock },
  overdue: { label: 'Overdue', variant: 'error' as const, icon: AlertTriangle },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
};

const priorityConfig = {
  critical: { label: 'Critical', variant: 'error' as const },
  high: { label: 'High', variant: 'error' as const },
  medium: { label: 'Medium', variant: 'warning' as const },
  low: { label: 'Low', variant: 'info' as const },
};

export function IDs() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Non-Worker ID Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage non-worker ID creation and provisioning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Bulk Approve</Button>
          <Button variant="primary">Create ID</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="mt-1 text-2xl font-bold">156</p>
              </div>
              <IdCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">23</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className="mt-1 text-2xl font-bold text-red-600">4</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Processing</p>
                <p className="mt-1 text-2xl font-bold">2.3h</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ID Request Queue</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Request Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">SLA</th>
                  <th className="pb-3">ID Number</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {idRequests.map((request) => {
                  const statusInfo = statusConfig[request.status];
                  const StatusIcon = statusInfo.icon;
                  const priorityInfo = priorityConfig[request.priority];

                  return (
                    <tr key={request.id} className="text-sm">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {request.candidateName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{request.candidateName}</p>
                            <p className="text-xs text-muted-foreground">Approver: {request.approver}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="default">{request.department}</Badge>
                      </td>
                      <td className="py-4 text-muted-foreground">{request.requestDate}</td>
                      <td className="py-4">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                      </td>
                      <td className="py-4">
                        <span
                          className={`font-medium ${
                            request.status === 'overdue'
                              ? 'text-red-600'
                              : request.sla.includes('hours')
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {request.sla}
                        </span>
                      </td>
                      <td className="py-4">
                        {request.idNumber ? (
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                            {request.idNumber}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {request.status === 'pending_approval' && (
                            <>
                              <Button variant="primary" size="sm">
                                Approve
                              </Button>
                              <Button variant="outline" size="sm">
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'completed' && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ID Creation Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { step: 'Request Submitted', status: 'completed', time: '0h' },
              { step: 'Manager Approval', status: 'completed', time: '2h' },
              { step: 'Security Verification', status: 'in_progress', time: '1h' },
              { step: 'ID Generation', status: 'pending', time: 'Pending' },
              { step: 'System Sync', status: 'pending', time: 'Pending' },
              { step: 'Credentials Delivery', status: 'pending', time: 'Pending' },
            ].map((step, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step.status === 'completed' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  {step.status === 'in_progress' && <Clock className="h-5 w-5 text-blue-600" />}
                  {step.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="font-medium">{step.step}</span>
                </div>
                <span className="text-sm text-muted-foreground">{step.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { action: 'ID created for Sarah Chen', time: '5 minutes ago', type: 'success' },
              { action: 'Approval pending for Michael Rodriguez', time: '15 minutes ago', type: 'warning' },
              { action: 'SLA breach for Alex Kumar', time: '1 hour ago', type: 'error' },
              { action: 'ID completed for Jordan Lee', time: '2 hours ago', type: 'success' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                <div
                  className={`mt-1 rounded-full p-2 ${
                    activity.type === 'success'
                      ? 'bg-emerald-100'
                      : activity.type === 'warning'
                      ? 'bg-amber-100'
                      : 'bg-red-100'
                  }`}
                >
                  <IdCard
                    className={`h-4 w-4 ${
                      activity.type === 'success'
                        ? 'text-emerald-600'
                        : activity.type === 'warning'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
