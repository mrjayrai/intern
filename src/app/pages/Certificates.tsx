import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import {
  Award,
  Search,
  Download,
  Send,
  CheckCircle,
  Clock,
  FileText,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';

type CertificateRecord = {
  id?: string;
  _id?: string;
  candidateName?: string;
  department?: string;
  internshipPeriod?: string;
  status?: string;
  certificateNumber?: string | null;
  mentor?: string;
  mentorApproved?: boolean;
};

const statusConfig = {
  issued: { label: 'Issued', variant: 'success' as const, icon: CheckCircle },
  pending_approval: { label: 'Pending Approval', variant: 'warning' as const, icon: Clock },
  in_progress: { label: 'In Progress', variant: 'info' as const, icon: Clock },
};

export function Certificates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState('Loading certificates...');

  useEffect(() => {
    let isMounted = true;

    api.certificates()
      .then((data) => {
        if (!isMounted) return;
        setCertificates(data);
        setStatusMessage(data.length ? 'Synced with backend' : 'No certificates found');
      })
      .catch((err) => {
        if (!isMounted) return;
        setCertificates([]);
        setStatusMessage(err instanceof Error ? err.message : 'Unable to load certificates');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCertificates = certificates.filter((cert) => {
    const query = searchTerm.toLowerCase();
    return [cert.candidateName, cert.department, cert.mentor, cert.certificateNumber]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const issuedCount = certificates.filter((cert) => cert.status === 'issued').length;
  const pendingCount = certificates.filter((cert) => cert.status === 'pending_approval').length;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and issue internship completion certificates. {statusMessage}
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
                <p className="mt-1 text-2xl font-bold">{issuedCount}</p>
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
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
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
                <p className="mt-1 text-2xl font-bold text-emerald-600">{issuedCount}</p>
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
                <p className="mt-1 text-2xl font-bold">-</p>
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
                {visibleCertificates.map((cert) => {
                  const statusInfo = statusConfig[cert.status as keyof typeof statusConfig] || statusConfig.in_progress;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={cert.id || cert._id || cert.candidateName} className="text-sm">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {(cert.candidateName || '?').split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{cert.candidateName || 'Unknown candidate'}</p>
                            <p className="text-xs text-muted-foreground">Mentor: {cert.mentor || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="default">{cert.department || '-'}</Badge>
                      </td>
                      <td className="py-4 text-muted-foreground">{cert.internshipPeriod || '-'}</td>
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
                              <Button variant="ghost" size="sm">
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
            {!visibleCertificates.length && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No certificates to display.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
