import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Activity,
  User,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  FileText,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';

const internships = [
  {
    id: 1,
    candidateName: 'Sarah Chen',
    department: 'Engineering',
    mentor: 'John Doe',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    status: 'active',
    progress: 65,
    stage: 'Mid-Term',
    attendance: 98,
    notes: 12,
  },
  {
    id: 2,
    candidateName: 'Michael Rodriguez',
    department: 'Design',
    mentor: 'Lisa Smith',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    status: 'active',
    progress: 45,
    stage: 'Onboarding',
    attendance: 100,
    notes: 8,
  },
  {
    id: 3,
    candidateName: 'Emma Wilson',
    department: 'Marketing',
    mentor: 'Tom Johnson',
    startDate: '2026-05-15',
    endDate: '2026-08-15',
    status: 'extended',
    progress: 85,
    stage: 'Final Review',
    attendance: 95,
    notes: 18,
  },
  {
    id: 4,
    candidateName: 'Alex Kumar',
    department: 'Engineering',
    mentor: 'Sarah Chen',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    status: 'delayed',
    progress: 30,
    stage: 'Delayed - Health',
    attendance: 65,
    notes: 15,
  },
  {
    id: 5,
    candidateName: 'Jordan Lee',
    department: 'Product',
    mentor: 'Mike Wilson',
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    status: 'closed',
    progress: 100,
    stage: 'Completed',
    attendance: 97,
    notes: 24,
  },
];

const statusConfig = {
  active: { label: 'Active', variant: 'success' as const, icon: Play },
  extended: { label: 'Extended', variant: 'info' as const, icon: TrendingUp },
  delayed: { label: 'Delayed', variant: 'warning' as const, icon: Pause },
  closed: { label: 'Closed', variant: 'default' as const, icon: StopCircle },
};

export function Tracking() {
  const selectedIntern = internships[0];

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Internship Lifecycle Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor and manage active internships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Export Report</Button>
          <Button variant="primary">Add Note</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Internships</p>
                <p className="mt-1 text-2xl font-bold">89</p>
              </div>
              <Play className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Extended</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">12</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delayed</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">7</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-bold">156</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Internships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {internships.map((intern) => {
                const statusInfo = statusConfig[intern.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={intern.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {intern.candidateName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{intern.candidateName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{intern.mentor}</span>
                          <span>•</span>
                          <span>{intern.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${intern.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{intern.progress}%</span>
                        </div>
                      </div>

                      <Badge variant={statusInfo.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline Stages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { stage: 'Referral Approved', status: 'completed' },
              { stage: 'Onboarded', status: 'completed' },
              { stage: 'Week 1-4: Orientation', status: 'completed' },
              { stage: 'Week 5-8: Core Projects', status: 'in_progress' },
              { stage: 'Week 9-12: Final Sprint', status: 'pending' },
              { stage: 'Evaluation Complete', status: 'pending' },
              { stage: 'Certified', status: 'pending' },
            ].map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      item.status === 'completed'
                        ? 'bg-emerald-100'
                        : item.status === 'in_progress'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {item.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    )}
                    {item.status === 'in_progress' && (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                    {item.status === 'pending' && (
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  {index < 6 && (
                    <div
                      className={`h-full w-0.5 ${
                        item.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium">{item.stage}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Intern View: {selectedIntern.candidateName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mentor</p>
                  <p className="font-medium">{selectedIntern.mentor}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {selectedIntern.startDate} - {selectedIntern.endDate}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="font-medium">{selectedIntern.attendance}%</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-3">
                <h4 className="font-semibold">Mentor Notes</h4>
                <div className="space-y-2">
                  {[
                    {
                      date: '2026-05-15',
                      note: 'Excellent progress on React components. Taking initiative on code reviews.',
                      author: 'John Doe',
                    },
                    {
                      date: '2026-05-10',
                      note: 'Completed onboarding training. Ready to start core project work.',
                      author: 'John Doe',
                    },
                    {
                      date: '2026-05-05',
                      note: 'First week orientation completed successfully.',
                      author: 'John Doe',
                    },
                  ].map((note, index) => (
                    <div key={index} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="mt-1 h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm">{note.note}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {note.author} • {note.date}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Request Extension
                  </Button>
                  <Button variant="outline" size="sm">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Delay
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
