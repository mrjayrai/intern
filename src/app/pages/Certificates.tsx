import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { api, getAccessToken, getStoredUser, type ApiRecord } from '../lib/api';
import { CandidateSelect, type CandidateOption } from '../components/CandidateSelect';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  RefreshCcw,
  Search,
  Send,
  User,
  XCircle,
} from 'lucide-react';

type CertificateStatus = 'issued' | 'pending_approval' | 'in_progress' | 'revoked' | 'draft';

type CertificateRecord = {
  id?: string;
  _id?: string;
  candidate?: string;
  candidateName?: string;
  candidateEmail?: string;
  department?: string;
  internshipDuration?: string;
  internshipPeriod?: string;
  completionDate?: string | null;
  issueDate?: string | null;
  status?: CertificateStatus | string;
  certificateNumber?: string | null;
  verificationId?: string | null;
  mentor?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorApproved?: boolean;
  pdfUrl?: string;
  downloadUrl?: string;
  certificateUrl?: string;
};

type IssueCertificateForm = {
  candidateName: string;
  candidateEmail: string;
  department: string;
  mentorName: string;
  mentorEmail: string;
  internshipPeriod: string;
  completionDate: string;
};

const initialIssueForm: IssueCertificateForm = {
  candidateName: '',
  candidateEmail: '',
  department: '',
  mentorName: '',
  mentorEmail: '',
  internshipPeriod: '',
  completionDate: '',
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'default'; icon: typeof Clock }> = {
  issued: { label: 'Issued', variant: 'success', icon: CheckCircle },
  pending_approval: { label: 'Pending Approval', variant: 'warning', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'info', icon: Clock },
  draft: { label: 'Draft', variant: 'default', icon: FileText },
  revoked: { label: 'Revoked', variant: 'error', icon: XCircle },
};

function getCertificateId(cert: CertificateRecord) {
  return cert.id || cert._id || cert.certificateNumber || cert.verificationId || cert.candidateEmail || cert.candidateName || cert.candidate || 'certificate';
}

function getStatusInfo(status?: string) {
  return statusConfig[status || 'in_progress'] || statusConfig.in_progress;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDownloadUrl(cert: CertificateRecord) {
  const id = cert._id || cert.id;
  return cert.pdfUrl || cert.downloadUrl || cert.certificateUrl || (id ? api.certificateDownloadUrl(id) : '');
}

function CertificatesSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export function Certificates() {
  const currentUser = getStoredUser();
  const role = currentUser?.role;
  const canIssue = role === 'hr' || role === 'superAdmin';

  const [searchTerm, setSearchTerm] = useState('');
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueCertificateForm>(initialIssueForm);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [issueError, setIssueError] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  const loadCertificates = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await api.certificates<CertificateRecord[]>();
      setCertificates(data);
    } catch (err) {
      setCertificates([]);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load certificates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const visibleCertificates = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return certificates.filter((cert) => (
      [
        cert.candidateName,
        cert.candidate,
        cert.candidateEmail,
        cert.department,
        cert.mentor,
        cert.mentorName,
        cert.mentorEmail,
        cert.certificateNumber,
        cert.verificationId,
        cert.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ));
  }, [certificates, searchTerm]);

  const issuedCount = certificates.filter((cert) => cert.status === 'issued').length;
  const pendingCount = certificates.filter((cert) => cert.status === 'pending_approval').length;
  const downloadableCount = certificates.filter((cert) => Boolean(getDownloadUrl(cert))).length;
  const completedCount = certificates.filter((cert) => cert.completionDate).length;

  const updateIssueForm = (field: keyof IssueCertificateForm, value: string) => {
    setIssueForm((current) => ({ ...current, [field]: value }));
  };

  const handleDownload = (cert: CertificateRecord) => {
    const url = getDownloadUrl(cert);
    if (!url) return;
    const token = getAccessToken();
    const separator = url.includes('?') ? '&' : '?';
    window.open(token ? `${url}${separator}token=${encodeURIComponent(token)}` : url, '_blank', 'noopener,noreferrer');
  };

  const handleIssueCertificate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIssueError('');

    if (
      !issueForm.candidateName.trim()
      || !issueForm.department.trim()
      || !issueForm.mentorName.trim()
      || !issueForm.internshipPeriod.trim()
      || !issueForm.completionDate
    ) {
      setIssueError('Candidate name, department, mentor, internship period, and completion date are required.');
      return;
    }

    setIsIssuing(true);

    try {
      const payload: ApiRecord = {
        candidate: issueForm.candidateName.trim(),
        candidateName: issueForm.candidateName.trim(),
        candidateEmail: issueForm.candidateEmail.trim() || undefined,
        department: issueForm.department.trim(),
        mentor: issueForm.mentorName.trim() || undefined,
        mentorName: issueForm.mentorName.trim() || undefined,
        mentorEmail: issueForm.mentorEmail.trim() || undefined,
        internshipDuration: issueForm.internshipPeriod.trim() || undefined,
        internshipPeriod: issueForm.internshipPeriod.trim() || undefined,
        completionDate: issueForm.completionDate,
      };

      await api.issueCertificate(payload);
      await loadCertificates();
      setIssueForm(initialIssueForm);
      setSelectedCandidateId('');
      setIsIssueOpen(false);
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : 'Unable to issue certificate');
    } finally {
      setIsIssuing(false);
    }
  };

  if (isLoading) {
    return <CertificatesSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue, track, and download internship completion certificates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={loadCertificates}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
          {canIssue && (
            <Button variant="primary" className="gap-2" onClick={() => setIsIssueOpen(true)}>
              <Plus className="h-4 w-4" />
              Issue Certificate
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Certificates could not be loaded</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
            <Button variant="outline" onClick={loadCertificates}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Issued</p>
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
                <p className="text-sm text-muted-foreground">Download Ready</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{downloadableCount}</p>
              </div>
              <Download className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Internships</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Issued Certificates</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visibleCertificates.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Mentor</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Completion</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Certificate #</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleCertificates.map((cert) => {
                    const statusInfo = getStatusInfo(cert.status);
                    const StatusIcon = statusInfo.icon;
                    const candidateName = cert.candidateName || cert.candidate || 'Unknown candidate';
                    const mentorName = cert.mentorName || cert.mentor || '-';
                    const downloadUrl = getDownloadUrl(cert);

                    return (
                      <tr key={getCertificateId(cert)} className="text-sm">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {candidateName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium">{candidateName}</p>
                              <p className="text-xs text-muted-foreground">{cert.candidateEmail || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{mentorName}</p>
                            <p className="text-xs text-muted-foreground">{cert.mentorEmail || 'No mentor email'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="default">{cert.department || '-'}</Badge>
                        </td>
                        <td className="py-4 text-muted-foreground">
                          <div>
                            <p>{formatDate(cert.completionDate)}</p>
                            <p className="text-xs">{cert.internshipPeriod || cert.internshipDuration || 'No period'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-4">
                          {cert.certificateNumber || cert.verificationId ? (
                            <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                              {cert.certificateNumber || cert.verificationId}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={!downloadUrl}
                              onClick={() => handleDownload(cert)}
                            >
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                            <Button variant="ghost" size="sm" disabled={!cert.candidateEmail}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center">
              <Award className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No certificates found</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {canIssue
                  ? 'Issue a certificate when an internship is complete, or retry after the backend has certificate records.'
                  : 'No certificates have been issued yet. Contact HR for assistance.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={loadCertificates}>
                  Retry
                </Button>
                {canIssue && (
                  <Button variant="primary" onClick={() => setIsIssueOpen(true)}>
                    Issue Certificate
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isIssueOpen} onOpenChange={(open) => { setIsIssueOpen(open); if (!open) { setIssueForm(initialIssueForm); setSelectedCandidateId(''); setIssueError(''); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Certificate</DialogTitle>
            <DialogDescription>
              Create a certificate request for a completed internship.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleIssueCertificate}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Candidate</label>
                <CandidateSelect
                  value={selectedCandidateId}
                  onChange={(candidate: CandidateOption | null) => {
                    if (candidate) {
                      setSelectedCandidateId(candidate.id);
                      updateIssueForm('candidateName', candidate.candidateName);
                      updateIssueForm('candidateEmail', candidate.candidateEmail);
                    } else {
                      setSelectedCandidateId('');
                      updateIssueForm('candidateName', '');
                      updateIssueForm('candidateEmail', '');
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">Department</label>
                <Input id="department" value={issueForm.department} onChange={(event) => updateIssueForm('department', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="completionDate" className="text-sm font-medium">Completion date</label>
                <Input id="completionDate" type="date" value={issueForm.completionDate} onChange={(event) => updateIssueForm('completionDate', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="mentorName" className="text-sm font-medium">Mentor name</label>
                <Input id="mentorName" value={issueForm.mentorName} onChange={(event) => updateIssueForm('mentorName', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="mentorEmail" className="text-sm font-medium">Mentor email</label>
                <Input id="mentorEmail" type="email" value={issueForm.mentorEmail} onChange={(event) => updateIssueForm('mentorEmail', event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="internshipPeriod" className="text-sm font-medium">Internship period</label>
                <Input id="internshipPeriod" value={issueForm.internshipPeriod} onChange={(event) => updateIssueForm('internshipPeriod', event.target.value)} placeholder="Jun 2026 - Aug 2026" required />
              </div>
            </div>

            {issueError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {issueError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsIssueOpen(false)} disabled={isIssuing}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isIssuing}>
                {isIssuing ? 'Issuing...' : 'Issue Certificate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
