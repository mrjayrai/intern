import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Award,
  Search,
  Download,
  Send,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { useState } from 'react';

const certificates = [
  {
    id: 1,
    candidateName: 'Jordan Lee',
    department: 'Product',
    internshipPeriod: 'Mar 2026 - May 2026',
    completionDate: '2026-05-31',
    status: 'issued',
    certificateNumber: 'CERT-2026-001',
    mentor: 'Mike Wilson',
    mentorApproved: true,
  },
  {
    id: 2,
    candidateName: 'Sarah Chen',
    department: 'Engineering',
    internshipPeriod: 'Jun 2026 - Aug 2026',
    completionDate: null,
    status: 'pending_approval',
    certificateNumber: null,
    mentor: 'John Doe',
    mentorApproved: false,
  },
  {
    id: 3,
    candidateName: 'Emma Wilson',
    department: 'Marketing',
    internshipPeriod: 'May 2026 - Aug 2026',
    completionDate: null,
    status: 'in_progress',
    certificateNumber: null,
    mentor: 'Tom Johnson',
    mentorApproved: true,
  },
];

const statusConfig = {
  issued: { label: 'Issued', variant: 'success' as const, icon: CheckCircle },
  pending_approval: { label: 'Pending Approval', variant: 'warning' as const, icon: Clock },
  in_progress: { label: 'In Progress', variant: 'info' as const, icon: Clock },
};

export function Certificates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and issue internship completion certificates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Preview Template</Button>
          <Button variant="primary">Generate Certificate</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Issued</p>
                <p className="mt-1 text-2xl font-bold">234</p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">12</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">18</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Processing</p>
                <p className="mt-1 text-2xl font-bold">2.1d</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Certificates</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
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
                  <th className="pb-3">Internship Period</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Certificate #</th>
                  <th className="pb-3">Mentor Approval</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {certificates.map((cert) => {
                  const statusInfo = statusConfig[cert.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={cert.id} className="text-sm">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {cert.candidateName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{cert.candidateName}</p>
                            <p className="text-xs text-muted-foreground">Mentor: {cert.mentor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="default">{cert.department}</Badge>
                      </td>
                      <td className="py-4 text-muted-foreground">{cert.internshipPeriod}</td>
                      <td className="py-4">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-4">
                        {cert.certificateNumber ? (
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                            {cert.certificateNumber}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        {cert.mentorApproved ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {cert.status === 'issued' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {cert.status === 'pending_approval' && (
                            <Button variant="primary" size="sm">
                              Approve
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

      {showPreview && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle>Certificate Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="rounded-lg border-4 border-blue-600 bg-white p-12 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <Award className="h-12 w-12 text-white" />
                </div>

                <h2 className="text-4xl font-bold text-blue-900">
                  Certificate of Completion
                </h2>

                <div className="my-8 space-y-4">
                  <p className="text-lg text-gray-600">This is to certify that</p>
                  <p className="text-3xl font-bold text-gray-900">Jordan Lee</p>
                  <p className="text-lg text-gray-600">
                    has successfully completed the internship program in
                  </p>
                  <p className="text-2xl font-semibold text-blue-700">Product Management</p>
                  <p className="text-lg text-gray-600">
                    From March 1, 2026 to May 31, 2026
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-8">
                  <div className="border-t-2 border-gray-300 pt-4">
                    <p className="font-semibold">Mike Wilson</p>
                    <p className="text-sm text-gray-600">Program Mentor</p>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-4">
                    <p className="font-semibold">HR Department</p>
                    <p className="text-sm text-gray-600">Authorized Signatory</p>
                  </div>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                  <p>Certificate Number: CERT-2026-001</p>
                  <p>Issue Date: May 31, 2026</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Button variant="primary">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Email Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Verification Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Completion Verification</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                System automatically checks internship completion, attendance records, and required
                documentation
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">Mentor Approval</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Mentor reviews intern performance and approves certificate generation
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-semibold">Certificate Generation</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                PDF certificate generated with unique number and digital signatures
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
