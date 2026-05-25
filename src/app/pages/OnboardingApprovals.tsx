import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileText,
  Download,
  AlertTriangle,
  RefreshCcw,
  Search,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { api, apiUrl, getAccessToken } from '../lib/api';

type OnboardingFormStatus = 'DRAFT' | 'SUBMITTED' | 'HR_APPROVED';

type OnboardingForm = {
  _id: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  status: OnboardingFormStatus;
  completionPercentage: number;
  submittedAt?: string;
  approval?: {
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    comment?: string;
  };
  personalDetails?: Record<string, unknown>;
  emergencyContact?: Record<string, unknown>;
  declarations?: {
    agreeToPolicies: boolean;
    agreeTerms: boolean;
    signature?: string;
  };
  attachments?: Array<{
    filename: string;
    originalName: string;
    path: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'default' as const, icon: FileText },
  SUBMITTED: { label: 'Pending Approval', variant: 'warning' as const, icon: Clock },
  HR_APPROVED: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
};

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function OnboardingApprovals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [forms, setForms] = useState<OnboardingForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedForm, setSelectedForm] = useState<OnboardingForm | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadForms = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const forms = await api.onboarding.list();
      setForms(forms || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load onboarding forms';
      setForms([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const filteredForms = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return forms.filter((form) =>
      [form.candidateName, form.candidateEmail, form.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [forms, searchTerm]);

  const pendingForms = forms.filter((form) => form.status === 'SUBMITTED');
  const approvedForms = forms.filter((form) => form.status === 'HR_APPROVED');

  const handleViewDetails = (form: OnboardingForm) => {
    setSelectedForm(form);
    setIsDetailsOpen(true);
  };

  const handleApproveClick = (form: OnboardingForm) => {
    setSelectedForm(form);
    setApprovalComment('');
    setIsApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedForm) return;

    setIsSubmitting(true);
    try {
      await api.onboarding.approve(selectedForm._id, approvalComment.trim() || undefined);
      toast.success('Onboarding form approved successfully');
      setIsApproveOpen(false);
      setApprovalComment('');
      await loadForms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAttachment = (attachment: OnboardingForm['attachments'][0]) => {
    if (!attachment) return;
    const token = getAccessToken();
    const url = attachment.path.startsWith('http') ? attachment.path : apiUrl(attachment.path);
    const separator = url.includes('?') ? '&' : '?';
    window.open(token ? `${url}${separator}token=${encodeURIComponent(token)}` : url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 xl:p-8">
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve candidate onboarding submissions
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={loadForms}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Forms could not be loaded</p>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="mt-1 text-2xl font-bold">{forms.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingForms.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{approvedForms.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Onboarding Submissions</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredForms.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Completion</th>
                    <th className="pb-3">Submitted</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredForms.map((form) => {
                    const statusInfo = statusConfig[form.status];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={form._id} className="text-sm">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {form.candidateName
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2) || <User className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{form.candidateName || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{form.candidateEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${form.completionPercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {form.completionPercentage || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-muted-foreground">
                          {formatDate(form.submittedAt || form.updatedAt)}
                        </td>
                        <td className="py-4">
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleViewDetails(form)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {form.status === 'SUBMITTED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleApproveClick(form)}
                              >
                                <CheckCircle className="h-4 w-4" />
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
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No submissions found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'Onboarding submissions will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboarding Details</DialogTitle>
            <DialogDescription>Review candidate submission details</DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Candidate Name</p>
                  <p className="mt-1">{selectedForm.candidateName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1">{selectedForm.candidateEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <Badge variant={statusConfig[selectedForm.status].variant}>
                      {statusConfig[selectedForm.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion</p>
                  <p className="mt-1">{selectedForm.completionPercentage}%</p>
                </div>
              </div>

              {selectedForm.declarations && (
                <div className="rounded-md border p-4">
                  <h4 className="font-semibold mb-2">Declarations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedForm.declarations.agreeToPolicies ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Agreed to policies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedForm.declarations.agreeTerms ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Agreed to terms</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedForm.attachments && selectedForm.attachments.length > 0 && (
                <div className="rounded-md border p-4">
                  <h4 className="font-semibold mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedForm.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{att.originalName || att.filename}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAttachment(att)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedForm.approval?.approved && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <h4 className="font-semibold text-green-900">Approved</h4>
                  <p className="text-sm text-green-700">
                    By {selectedForm.approval.approvedBy} on {formatDate(selectedForm.approval.approvedAt)}
                  </p>
                  {selectedForm.approval.comment && (
                    <p className="mt-2 text-sm text-green-800">{selectedForm.approval.comment}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Onboarding</DialogTitle>
            <DialogDescription>
              Approve {selectedForm?.candidateName}'s onboarding submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Approval Comment (Optional)</label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add any comments or notes..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <strong>Next Steps:</strong> Once approved, the candidate will receive their offer letter
              and an NDA will be assigned for signature.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? 'Approving...' : 'Approve Onboarding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
