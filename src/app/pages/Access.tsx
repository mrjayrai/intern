import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Key,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Shield,
  CreditCard,
  Server,
  Lock
} from 'lucide-react';

const accessRequests = [
  {
    id: 1,
    candidateName: 'Sarah Chen',
    department: 'Engineering',
    services: ['Active Directory', 'Email', 'VPN', 'GitHub', 'Slack'],
    status: 'completed',
    adAccount: 'schen@company.com',
    badgeNumber: 'TMP-2026-1234',
    completedDate: '2026-05-14',
  },
  {
    id: 2,
    candidateName: 'Michael Rodriguez',
    department: 'Design',
    services: ['Active Directory', 'Email', 'Figma', 'Slack'],
    status: 'in_progress',
    adAccount: 'mrodriguez@company.com',
    badgeNumber: null,
    completedDate: null,
  },
  {
    id: 3,
    candidateName: 'Emma Wilson',
    department: 'Marketing',
    services: ['Active Directory', 'Email', 'HubSpot', 'Slack'],
    status: 'pending',
    adAccount: null,
    badgeNumber: null,
    completedDate: null,
  },
];

const statusConfig = {
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
  in_progress: { label: 'In Progress', variant: 'info' as const, icon: Clock },
  pending: { label: 'Pending', variant: 'warning' as const, icon: AlertTriangle },
};

export function Access() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IT Access Provisioning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage system access and credentials for interns
          </p>
        </div>
        <Button variant="primary">Provision Access</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Provisioned</p>
                <p className="mt-1 text-2xl font-bold">145</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">12</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">8</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time</p>
                <p className="mt-1 text-2xl font-bold">1.8h</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessRequests.map((request) => {
              const statusInfo = statusConfig[request.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={request.id}
                  className="rounded-lg border border-border p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {request.candidateName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.candidateName}</h3>
                        <p className="text-sm text-muted-foreground">{request.department}</p>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-xs text-muted-foreground">AD Account</p>
                            <p className="mt-1 text-sm font-medium">
                              {request.adAccount || 'Pending'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Badge Number</p>
                            <p className="mt-1 text-sm font-medium">
                              {request.badgeNumber || 'Pending'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Completion Date</p>
                            <p className="mt-1 text-sm font-medium">
                              {request.completedDate || 'Pending'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Services ({request.services.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {request.services.map((service) => (
                              <Badge key={service} variant="default">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Badge variant={statusInfo.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {request.status !== 'completed' && (
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <Button variant="primary" size="sm">
                        Provision Services
                      </Button>
                      <Button variant="outline" size="sm">
                        Send Credentials
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provisioning Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                step: 'AD Account Creation',
                icon: Server,
                status: 'completed',
                details: 'Username and email generated',
              },
              {
                step: 'Password & OTP Setup',
                icon: Lock,
                status: 'completed',
                details: 'Temporary credentials sent',
              },
              {
                step: 'Badge Access',
                icon: CreditCard,
                status: 'in_progress',
                details: 'Physical badge printing',
              },
              {
                step: 'Email Provisioning',
                icon: Mail,
                status: 'pending',
                details: 'Mailbox creation pending',
              },
              {
                step: 'System Access',
                icon: Shield,
                status: 'pending',
                details: 'Application access grants',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      item.status === 'completed'
                        ? 'bg-emerald-100'
                        : item.status === 'in_progress'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        item.status === 'completed'
                          ? 'text-emerald-600'
                          : item.status === 'in_progress'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.step}</p>
                      {item.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      )}
                      {item.status === 'in_progress' && (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.details}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-900">Background Check Complete</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    All security clearances verified and approved
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">2FA Enabled</p>
                  <p className="mt-1 text-sm text-blue-700">
                    Multi-factor authentication configured for all accounts
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Access Policy Applied</p>
                  <p className="mt-1 text-sm text-purple-700">
                    Role-based access control configured per intern guidelines
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <h4 className="font-semibold">Credential Delivery</h4>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">OTP sent to email</span>
                </div>
                <Badge variant="success">Delivered</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Badge ready for pickup</span>
                </div>
                <Badge variant="info">Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
