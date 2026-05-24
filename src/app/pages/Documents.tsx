import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { api, apiUrl, getAccessToken, getStoredUser, type NdaRecord, type NdaStatus, type UserRole } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

type Filters = {
  query: string;
  status: string;
  expiry: string;
  signing: string;
};

type UploadForm = {
  referralId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  title: string;
  description: string;
  version: string;
  expiresAt: string;
  ndaFile: File | null;
};

const defaultUploadForm: UploadForm = {
  referralId: '',
  candidateId: '',
  candidateName: '',
  candidateEmail: '',
  title: '',
  description: '',
  version: '1',
  expiresAt: '',
  ndaFile: null,
};

const defaultFilters: Filters = {
  query: '',
  status: 'all',
  expiry: 'all',
  signing: 'all',
};

const statusConfig: Record<NdaStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', variant: 'default', icon: FileText },
  PENDING_SIGNATURE: { label: 'Pending Signature', variant: 'warning', icon: Clock },
  SIGNED: { label: 'Signed', variant: 'info', icon: FileSignature },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'error', icon: XCircle },
  EXPIRED: { label: 'Expired', variant: 'error', icon: AlertTriangle },
  ARCHIVED: { label: 'Archived', variant: 'default', icon: Archive },
};

function getNdaId(record: NdaRecord) {
  return record._id;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'PP');
}

function getDownloadLink(documentUrl?: string) {
  if (!documentUrl) return '';
  const token = getAccessToken();
  const absoluteUrl = documentUrl.startsWith('http') ? documentUrl : apiUrl(documentUrl);
  const separator = absoluteUrl.includes('?') ? '&' : '?';
  return token ? `${absoluteUrl}${separator}token=${encodeURIComponent(token)}` : absoluteUrl;
}

function isExpired(expiresAt?: string) {
  return !!expiresAt && new Date(expiresAt) < new Date();
}

export function Documents() {
  const currentUser = getStoredUser();
  const role = currentUser?.role;
  const canUpload = role === 'hr' || role === 'compliance' || role === 'superAdmin';
  const canApprove = role === 'hr' || role === 'compliance' || role === 'superAdmin';
  const canArchive = role === 'hr' || role === 'superAdmin';
  const canDelete = role === 'superAdmin';
  const canSign = role === 'candidate' || role === 'superAdmin';

  const [documents, setDocuments] = useState<NdaRecord[]>([]);
  const [selectedNda, setSelectedNda] = useState<NdaRecord | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>(defaultUploadForm);
  const [signatureName, setSignatureName] = useState('');
  const [signatureAccepted, setSignatureAccepted] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNdas = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await api.nda.list();
      setDocuments(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load NDAs';
      setDocuments([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNdas();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const query = filters.query.trim().toLowerCase();
      const matchesQuery = !query || [
        doc.candidateName,
        doc.title,
        doc.candidateEmail,
        doc.originalFilename,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus = filters.status === 'all' || doc.status === filters.status;
      const matchesExpiry =
        filters.expiry === 'all'
          ? true
          : filters.expiry === 'expired'
            ? isExpired(doc.expiresAt)
            : !isExpired(doc.expiresAt);
      const matchesSigning =
        filters.signing === 'all'
          ? true
          : filters.signing === 'signed'
            ? !!doc.signedAt
            : !doc.signedAt;

      return matchesQuery && matchesStatus && matchesExpiry && matchesSigning;
    });
  }, [documents, filters]);

  const metrics = useMemo(() => {
    return {
      total: documents.length,
      pending: documents.filter((doc) => doc.status === 'PENDING_SIGNATURE').length,
      signed: documents.filter((doc) => doc.status === 'SIGNED' || doc.status === 'APPROVED').length,
      expired: documents.filter((doc) => isExpired(doc.expiresAt) || doc.status === 'EXPIRED').length,
    };
  }, [documents]);

  const resetActionState = () => {
    setSignatureName('');
    setSignatureAccepted(false);
    setActionNotes('');
    setIsSignOpen(false);
    setIsApproveOpen(false);
    setIsRejectOpen(false);
    setIsArchiveOpen(false);
  };

  const refreshAndClose = async (successMessage: string) => {
    await loadNdas();
    toast.success(successMessage);
    resetActionState();
    setIsUploadOpen(false);
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim() || !uploadForm.ndaFile) {
      toast.error('Title and NDA file are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title.trim());
      if (uploadForm.description.trim()) formData.append('description', uploadForm.description.trim());
      if (uploadForm.referralId.trim()) formData.append('referralId', uploadForm.referralId.trim());
      if (uploadForm.candidateId.trim()) formData.append('candidateId', uploadForm.candidateId.trim());
      if (uploadForm.candidateName.trim()) formData.append('candidateName', uploadForm.candidateName.trim());
      if (uploadForm.candidateEmail.trim()) formData.append('candidateEmail', uploadForm.candidateEmail.trim());
      if (uploadForm.expiresAt) formData.append('expiresAt', uploadForm.expiresAt);
      formData.append('nda', uploadForm.ndaFile);

      await api.nda.create(formData);
      setUploadForm(defaultUploadForm);
      await refreshAndClose('NDA uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to upload NDA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSign = async () => {
    if (!selectedNda) return;
    if (!signatureName.trim() || !signatureAccepted) {
      toast.error('Full name confirmation and acceptance are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.nda.sign(selectedNda._id, {
        signatureName: signatureName.trim(),
        signatureAccepted: true,
        notes: actionNotes.trim() || undefined,
      });
      await refreshAndClose('NDA signed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to sign NDA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedNda) return;
    setIsSubmitting(true);
    try {
      await api.nda.approve(selectedNda._id, actionNotes.trim() || undefined);
      await refreshAndClose('NDA approved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to approve NDA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedNda) return;
    setIsSubmitting(true);
    try {
      await api.nda.reject(selectedNda._id, actionNotes.trim() || undefined);
      await refreshAndClose('NDA rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to reject NDA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedNda) return;
    setIsSubmitting(true);
    try {
      await api.nda.archive(selectedNda._id, actionNotes.trim() || undefined);
      await refreshAndClose('NDA archived');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to archive NDA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (nda: NdaRecord) => {
    setIsSubmitting(true);
    try {
      await api.nda.remove(nda._id);
      await loadNdas();
      toast.success('NDA deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to delete NDA');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">NDA & Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage NDA uploads, candidate signatures, compliance approvals, and expiry tracking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadNdas}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
          {canUpload ? (
            <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload NDA
            </Button>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Documents could not be loaded</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
            <Button variant="outline" onClick={loadNdas}>Try again</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total NDAs</p><p className="mt-1 text-2xl font-bold">{metrics.total}</p></div><FileText className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending signature</p><p className="mt-1 text-2xl font-bold text-amber-600">{metrics.pending}</p></div><Clock className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Signed / approved</p><p className="mt-1 text-2xl font-bold text-emerald-600">{metrics.signed}</p></div><ShieldCheck className="h-8 w-8 text-emerald-500" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Expired</p><p className="mt-1 text-2xl font-bold text-red-600">{metrics.expired}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <CardTitle>NDA register</CardTitle>
              <p className="text-sm text-muted-foreground">Track document versions, sign-off status, approvals, and expiry windows.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidate or title"
                  value={filters.query}
                  onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                  className="pl-10"
                />
              </div>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="all">All status</option>
                {Object.keys(statusConfig).map((status) => (
                  <option key={status} value={status}>{statusConfig[status as NdaStatus].label}</option>
                ))}
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.expiry} onChange={(event) => setFilters((current) => ({ ...current, expiry: event.target.value }))}>
                <option value="all">All expiry</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.signing} onChange={(event) => setFilters((current) => ({ ...current, signing: event.target.value }))}>
                <option value="all">Signed and pending</option>
                <option value="signed">Signed only</option>
                <option value="pending">Pending only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : filteredDocuments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Uploaded</th>
                    <th className="pb-3">Signed</th>
                    <th className="pb-3">Expiry</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocuments.map((doc) => {
                    const statusInfo = statusConfig[doc.status] || statusConfig.DRAFT;
                    const StatusIcon = statusInfo.icon;
                    const expired = isExpired(doc.expiresAt) || doc.status === 'EXPIRED';
                    const canCurrentUserSign =
                      canSign &&
                      doc.status === 'PENDING_SIGNATURE' &&
                      (role === 'superAdmin' || doc.candidateId === currentUser?.id || doc.candidateEmail === currentUser?.email);

                    return (
                      <tr key={getNdaId(doc)} className="text-sm">
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{doc.candidateName || 'Unassigned'}</p>
                            <p className="text-xs text-muted-foreground">{doc.candidateEmail || 'No email'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.originalFilename || doc.documentType || 'No file name'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="default">v{doc.version || 1}</Badge>
                        </td>
                        <td className="py-4">
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-4 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                        <td className="py-4 text-muted-foreground">{formatDate(doc.signedAt)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className={expired ? 'font-medium text-red-700' : 'text-muted-foreground'}>
                              {formatDate(doc.expiresAt)}
                            </span>
                            {expired ? <Badge variant="error">Expired</Badge> : null}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedNda(doc); setIsDetailsOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" disabled={!doc.documentUrl} onClick={() => window.open(getDownloadLink(doc.documentUrl), '_blank', 'noopener,noreferrer')}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canCurrentUserSign ? (
                              <Button variant="outline" size="sm" onClick={() => { setSelectedNda(doc); setIsSignOpen(true); }}>
                                <FileSignature className="h-4 w-4" />
                                Sign
                              </Button>
                            ) : null}
                            {canApprove && doc.status === 'SIGNED' ? (
                              <>
                                <Button variant="outline" size="sm" onClick={() => { setSelectedNda(doc); setActionNotes(doc.notes || ''); setIsRejectOpen(true); }}>
                                  Reject
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => { setSelectedNda(doc); setActionNotes(doc.notes || ''); setIsApproveOpen(true); }}>
                                  Approve
                                </Button>
                              </>
                            ) : null}
                            {canArchive && !['ARCHIVED', 'APPROVED'].includes(doc.status) ? (
                              <Button variant="outline" size="sm" onClick={() => { setSelectedNda(doc); setActionNotes(doc.notes || ''); setIsArchiveOpen(true); }}>
                                <Archive className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {canDelete ? (
                              <Button variant="ghost" size="sm" disabled={isSubmitting} onClick={() => void handleDelete(doc)}>
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            ) : null}
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
              <Upload className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No NDA records found</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Upload an NDA to start the signature workflow, or adjust filters to review existing documents.
              </p>
              {canUpload ? (
                <Button className="mt-4" variant="primary" onClick={() => setIsUploadOpen(true)}>
                  Upload NDA
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload NDA</DialogTitle>
            <DialogDescription>Upload a PDF, DOC, or DOCX file and assign it to a candidate workflow.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <Input value={uploadForm.title} onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Version label</label>
              <Input value={uploadForm.version} onChange={(event) => setUploadForm((current) => ({ ...current, version: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Referral ID</label>
              <Input value={uploadForm.referralId} onChange={(event) => setUploadForm((current) => ({ ...current, referralId: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Candidate ID</label>
              <Input value={uploadForm.candidateId} onChange={(event) => setUploadForm((current) => ({ ...current, candidateId: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Candidate name</label>
              <Input value={uploadForm.candidateName} onChange={(event) => setUploadForm((current) => ({ ...current, candidateName: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Candidate email</label>
              <Input type="email" value={uploadForm.candidateEmail} onChange={(event) => setUploadForm((current) => ({ ...current, candidateEmail: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Expiry date</label>
              <Input type="date" value={uploadForm.expiresAt} onChange={(event) => setUploadForm((current) => ({ ...current, expiresAt: event.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Document file</label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setUploadForm((current) => ({ ...current, ndaFile: event.target.files?.[0] || null }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Textarea rows={4} value={uploadForm.description} onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpload} disabled={isSubmitting}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>NDA details</DialogTitle>
            <DialogDescription>Review document metadata, ownership, and approval notes.</DialogDescription>
          </DialogHeader>
          {selectedNda ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Candidate</span><span>{selectedNda.candidateName || 'Unassigned'}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span>{selectedNda.candidateEmail || 'N/A'}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Title</span><span>{selectedNda.title}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Version</span><span>v{selectedNda.version || 1}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><span>{statusConfig[selectedNda.status].label}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Uploaded date</span><span>{formatDate(selectedNda.createdAt)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Signed date</span><span>{formatDate(selectedNda.signedAt)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Expiry date</span><span>{formatDate(selectedNda.expiresAt)}</span></div>
              <div className="rounded-lg border border-border bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="mt-2">{selectedNda.description || 'No description provided.'}</p>
              </div>
              <div className="rounded-lg border border-border bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-2 whitespace-pre-wrap">{selectedNda.notes || 'No notes recorded.'}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isSignOpen} onOpenChange={setIsSignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sign NDA</DialogTitle>
            <DialogDescription>Confirm your full legal name and accept the NDA terms before signing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Type full name</label>
              <Input value={signatureName} onChange={(event) => setSignatureName(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Notes</label>
              <Textarea rows={3} value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} />
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <Checkbox checked={signatureAccepted} onCheckedChange={(checked) => setSignatureAccepted(Boolean(checked))} />
              <span>I confirm this typed name is my legal signature and I accept the NDA terms.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSign} disabled={isSubmitting}>
              <FileSignature className="h-4 w-4" />
              Sign NDA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve NDA</DialogTitle>
            <DialogDescription>Add optional approval notes before final sign-off.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} placeholder="Approval notes" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleApprove} disabled={isSubmitting}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject NDA</DialogTitle>
            <DialogDescription>Provide notes so the candidate or HR team knows what needs correction.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} placeholder="Rejection notes" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Archive NDA</DialogTitle>
            <DialogDescription>Archive this NDA and keep an internal reason for audit and history.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} placeholder="Archive reason" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleArchive} disabled={isSubmitting}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
