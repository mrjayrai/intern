import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  ArrowRight,
  MoreVertical
} from 'lucide-react';

interface InternCard {
  id: number;
  name: string;
  email: string;
  avatar: string;
  department: string;
  mentor: string;
  sla: string;
  slaStatus: 'ok' | 'warning' | 'critical';
  stage: string;
}

const stages = [
  'Referral Received',
  'Pending Review',
  'NDA Pending',
  'ID Creation',
  'Access Provisioning',
  'Ready to Start',
];

const kanbanData: Record<string, InternCard[]> = {
  'Referral Received': [
    {
      id: 1,
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      avatar: 'SC',
      department: 'Engineering',
      mentor: 'John Doe',
      sla: '2 days left',
      slaStatus: 'ok',
      stage: 'Referral Received',
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      email: 'michael.r@email.com',
      avatar: 'MR',
      department: 'Design',
      mentor: 'Lisa Smith',
      sla: '4 hours left',
      slaStatus: 'warning',
      stage: 'Referral Received',
    },
  ],
  'Pending Review': [
    {
      id: 3,
      name: 'Emma Wilson',
      email: 'emma.w@email.com',
      avatar: 'EW',
      department: 'Marketing',
      mentor: 'Tom Johnson',
      sla: 'Overdue 2h',
      slaStatus: 'critical',
      stage: 'Pending Review',
    },
  ],
  'NDA Pending': [
    {
      id: 4,
      name: 'Alex Kumar',
      email: 'alex.k@email.com',
      avatar: 'AK',
      department: 'Engineering',
      mentor: 'Sarah Chen',
      sla: '1 day left',
      slaStatus: 'ok',
      stage: 'NDA Pending',
    },
    {
      id: 5,
      name: 'Jordan Lee',
      email: 'jordan.l@email.com',
      avatar: 'JL',
      department: 'Product',
      mentor: 'Mike Wilson',
      sla: '3 days left',
      slaStatus: 'ok',
      stage: 'NDA Pending',
    },
  ],
  'ID Creation': [
    {
      id: 6,
      name: 'Taylor Brown',
      email: 'taylor.b@email.com',
      avatar: 'TB',
      department: 'Operations',
      mentor: 'Emma Davis',
      sla: '6 hours left',
      slaStatus: 'warning',
      stage: 'ID Creation',
    },
  ],
  'Access Provisioning': [
    {
      id: 7,
      name: 'Casey Martinez',
      email: 'casey.m@email.com',
      avatar: 'CM',
      department: 'Engineering',
      mentor: 'John Doe',
      sla: '2 days left',
      slaStatus: 'ok',
      stage: 'Access Provisioning',
    },
  ],
  'Ready to Start': [
    {
      id: 8,
      name: 'Riley Anderson',
      email: 'riley.a@email.com',
      avatar: 'RA',
      department: 'Design',
      mentor: 'Lisa Smith',
      sla: 'Completed',
      slaStatus: 'ok',
      stage: 'Ready to Start',
    },
  ],
};

function InternCard({ intern }: { intern: InternCard }) {
  return (
    <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {intern.avatar}
            </div>
            <div>
              <p className="font-medium">{intern.name}</p>
              <p className="text-xs text-muted-foreground">{intern.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {intern.department}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Mentor:</span>
            <span className="font-medium">{intern.mentor}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {intern.slaStatus === 'ok' && <CheckCircle className="h-3 w-3 text-emerald-600" />}
              {intern.slaStatus === 'warning' && <Clock className="h-3 w-3 text-amber-600" />}
              {intern.slaStatus === 'critical' && <AlertCircle className="h-3 w-3 text-red-600" />}
              <span
                className={`text-xs font-medium ${
                  intern.slaStatus === 'ok'
                    ? 'text-emerald-600'
                    : intern.slaStatus === 'warning'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {intern.sla}
              </span>
            </div>
            {intern.slaStatus === 'critical' && (
              <Badge variant="error" className="text-xs">
                Escalated
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Onboarding() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR Onboarding Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage onboarding workflow with kanban view
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">Export Report</Button>
          <Button variant="primary">Bulk Actions</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">12</p>
              <p className="text-xs text-muted-foreground">On Track</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">5</p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">2</p>
              <p className="text-xs text-muted-foreground">SLA Breach</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">3.2d</p>
              <p className="text-xs text-muted-foreground">Avg Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-4" style={{ minWidth: '100%' }}>
          {stages.map((stage) => (
            <div key={stage} className="w-80 shrink-0">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-100 p-3">
                <div>
                  <h3 className="font-semibold">{stage}</h3>
                  <p className="text-xs text-muted-foreground">
                    {kanbanData[stage]?.length || 0} interns
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {kanbanData[stage]?.map((intern) => (
                  <InternCard key={intern.id} intern={intern} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
