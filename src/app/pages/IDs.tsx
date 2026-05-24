import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Search, Filter, CheckCircle, Clock, AlertTriangle, IdCard, Download, Plus, RefreshCcw } from 'lucide-react';
import { api, getStoredUser, type NonWorkerIdRequest, type NonWorkerIdPayload, type UserRole } from '../lib/api';
import { CandidateSelect, type CandidateOption } from '../components/CandidateSelect';
import { SLAIndicator } from '../components/enterprise/SLAIndicator';
import { WorkflowCard } from '../components/enterprise/WorkflowCard';
import { StatusBadge } from '../components/enterprise/StatusBadge';

const statusOrder: Record<NonWorkerIdRequest['requestStatus'], number> = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  COMPLETED: 4,
};

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
];

const sortOptions = [
  { value: 'requestedAt', label: 'Request date' },
  { value: 'slaDeadline', label: 'SLA deadline' },
  { value: 'requestStatus', label: 'Status' },
];

type CreateIdForm = {
  candidateName: string;
  candidateEmail: string;
  candidateId?: string;
  notes?: string;
};

type ApprovalDialog = {
  id: string;
  type: 'approve' | 'reject';
  open: boolean;
};

export function IDs() {
  const storedUser = getStoredUser();
  const userRole = storedUser?.role;
  const canManage = userRole === 'hr' || userRole === 'superAdmin';
  const canCreate = userRole === 'candidate' || canManage;
  const canViewList = canManage;

  const [requests, setRequests] = useState<NonWorkerIdRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'requestedAt' | 'slaDeadline' | 'requestStatus'>('requestedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCandidate, setCreateCandidate] = useState<CandidateOption | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialog | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { id: string; action: 'complete' }>(null);

  const fetchRequests = async () => {
    if (!canViewList) {
      setRequests([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.ids.list();
      setRequests(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load ID requests';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userRole]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests
      .filter((request) => {
        if (statusFilter !== 'all' && request.requestStatus !== statusFilter) return false;
        if (!normalizedSearch) return true;
        return [request.candidateName, request.candidateEmail, request.employeeId, request.requestStatus]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (sortKey === 'requestStatus') {
          return sortDirection === 'asc'
            ? statusOrder[a.requestStatus] - statusOrder[b.requestStatus]
            : statusOrder[b.requestStatus] - statusOrder[a.requestStatus];
        }

        const valueA = a[sortKey] || '';
        const valueB = b[sortKey] || '';
        const dateA = new Date(String(valueA)).getTime();
        const dateB = new Date(String(valueB)).getTime();

        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [requests, searchTerm, statusFilter, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const pagedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((request) => request.requestStatus === 'PENDING').length;
    const breaches = requests.filter((request) => {
      if (!request.slaDeadline) return false;
      return new Date(request.slaDeadline) < new Date() && request.requestStatus === 'PENDING';
    }).length;
    const avgHours = requests.length
      ? Math.round(
          requests.reduce((sum, request) => {
            const start = new Date(request.requestedAt).getTime();
            const end = request.completedAt ? new Date(request.completedAt).getTime() : Date.now();
            return sum + Math.max(0, end - start) / (1000 * 60 * 60);
          }, 0) / requests.length,
        )
      : 0;

    return { total, pending, breaches, avgHours };
  }, [requests]);

  const handleCreate = async (values: CreateIdForm) => {
    const candidateId = storedUser?.role === 'candidate'
      ? storedUser.id
      : (createCandidate?.id ?? values.candidateId?.trim());

    if (!candidateId) {
      toast.error('Please select a candidate');
      return;
    }

    const payload: NonWorkerIdPayload = {
      candidateId,
      candidateName: createCandidate?.candidateName ?? values.candidateName,
      candidateEmail: createCandidate?.candidateEmail ?? values.candidateEmail,
      notes: values.notes,
    };

    try {
      const created = await api.ids.create(payload);
      setRequests((current) => [created, ...current]);
      toast.success('ID request created');
      setIsCreateOpen(false);
      setCreateCandidate(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create request';
      toast.error(message);
    }
  };

  const handleApprovalAction = async () => {
    if (!approvalDialog) return;
    const previous = requests;
    const optimisticStatus = approvalDialog.type === 'approve' ? 'APPROVED' : 'REJECTED';

    setRequests((current) =>
      current.map((item) =>
        item._id === approvalDialog.id
          ? {
              ...item,
              requestStatus: optimisticStatus,
              approvedAt: approvalDialog.type === 'approve' ? new Date().toISOString() : item.approvedAt,
              rejectedAt: approvalDialog.type === 'reject' ? new Date().toISOString() : item.rejectedAt,
            }
          : item,
      ),
    );

    try {
      const result =
        approvalDialog.type === 'approve'
          ? await api.ids.approve(approvalDialog.id, actionComment)
          : await api.ids.reject(approvalDialog.id, actionComment);

      setRequests((current) => current.map((item) => (item._id === result._id ? result : item)));
      toast.success(`Request ${approvalDialog.type === 'approve' ? 'approved' : 'rejected'}`);
    } catch (err) {
      setRequests(previous);
      const message = err instanceof Error ? err.message : 'Unable to update request';
      toast.error(message);
    } finally {
      setApprovalDialog(null);
      setActionComment('');
    }
  };

  const handleComplete = async () => {
    if (!confirmAction) return;
    const previous = requests;

    setRequests((current) =>
      current.map((item) =>
        item._id === confirmAction.id ? { ...item, requestStatus: 'COMPLETED', completedAt: new Date().toISOString() } : item,
      ),
    );

    try {
      const result = await api.ids.complete(confirmAction.id);
      setRequests((current) => current.map((item) => (item._id === result._id ? result : item)));
      toast.success('ID request completed');
    } catch (err) {
      setRequests(previous);
      const message = err instanceof Error ? err.message : 'Unable to complete request';
      toast.error(message);
    } finally {
      setConfirmAction(null);
      setIsConfirmOpen(false);
    }
  };

  const canShowEmpty = !isLoading && !error && pagedRequests.length === 0;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Non-Worker ID Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and approve non-worker ID requests with SLA awareness and workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create request
            </Button>
          )}
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total requests</p>
                <p className="mt-1 text-2xl font-bold">{metrics.total}</p>
              </div>
              <IdCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending approval</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{metrics.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA breaches</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{metrics.breaches}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg processing</p>
                <p className="mt-1 text-2xl font-bold">{metrics.avgHours}h</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1.5fr)_auto]">
            <div>
              <CardTitle>ID Request Queue</CardTitle>
              <p className="text-sm text-muted-foreground">Search, filter, and take action on ID requests.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search requests"
                  className="pl-10"
                />
              </div>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
                  value={`${sortKey}:${sortDirection}`}
                  onChange={(event) => {
                    const [key, direction] = event.target.value.split(':') as [typeof sortKey, 'asc' | 'desc'];
                    setSortKey(key);
                    setSortDirection(direction);
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={`${option.value}:desc`}>
                      {option.label} descending
                    </option>
                  ))}
                  {sortOptions.map((option) => (
                    <option key={`${option.value}:asc`} value={`${option.value}:asc`}>
                      {option.label} ascending
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </div>
          </CardHeader>
       
        <CardContent>
          {error ? (
            <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-6">
              <p className="font-medium text-red-900">Unable to load ID requests</p>
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" onClick={fetchRequests}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-72 w-full rounded-md" />
            </div>
          ) : canShowEmpty ? (
            <div className="space-y-4 rounded-lg border border-dashed border-border bg-background p-8 text-center">
              <p className="text-lg font-semibold">No matching ID requests</p>
              <p className="text-sm text-muted-foreground">Adjust filters or create a new request to start the workflow.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Requested</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">SLA</th>
                    <th className="pb-3">Notes</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedRequests.map((request) => (
                    <tr key={request._id} className="text-sm">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {request.candidateName
                              .split(' ')
                              .map((segment) => segment[0])
                              .join('')}
                          </div>
                          <div>
                            <p className="font-medium">{request.candidateName}</p>
                            <p className="text-xs text-muted-foreground">ID: {request.employeeId || 'TBD'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{request.candidateEmail}</td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={request.requestStatus} />
                      </td>
                      <td className="py-4">
                        <SLAIndicator deadline={request.slaDeadline} />
                      </td>
                      <td className="py-4 max-w-[240px] truncate text-sm text-muted-foreground">{request.notes || '—'}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {canManage && request.requestStatus === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setApprovalDialog({ id: request._id, type: 'approve', open: true })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setApprovalDialog({ id: request._id, type: 'reject', open: true })}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {canManage && request.requestStatus === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setConfirmAction({ id: request._id, action: 'complete' });
                                setIsConfirmOpen(true);
                              }}
                            >
                              Complete
                            </Button>
                          )}
                          {request.requestStatus === 'COMPLETED' && (
                            <Button size="sm" variant="ghost" className="px-2">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(filteredRequests.length, page * pageSize)} of {filteredRequests.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
        <WorkflowCard
          title="Enterprise workflow overview"
          steps={[
            { title: 'ID request intake', status: 'completed' },
            { title: 'HR approval', status: requests.some((req) => req.requestStatus === 'PENDING') ? 'in_progress' : 'completed' },
            { title: 'ID issuance', status: requests.some((req) => req.requestStatus === 'APPROVED') ? 'in_progress' : 'pending' },
            { title: 'Provisioning handoff', status: requests.some((req) => req.requestStatus === 'COMPLETED') ? 'completed' : 'pending' },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Session summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Active workflow</p>
              <p className="mt-2 text-lg font-semibold">Non-worker ID request lifecycle</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review approvals, track SLA performance, and complete provisioning for external contractor IDs.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">HR approval required</p>
                  <p className="text-sm text-muted-foreground">Only HR and admin roles can approve or reject requests.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">SLA aware routing</p>
                  <p className="text-sm text-muted-foreground">Requests over SLA are highlighted and prioritized for resolution.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setCreateCandidate(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create new ID request</DialogTitle>
            <DialogDescription>
              Submit a non-worker ID request and route it through HR approval.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const values: CreateIdForm = {
                candidateName: String(formData.get('candidateName') || ''),
                candidateEmail: String(formData.get('candidateEmail') || ''),
                candidateId: String(formData.get('candidateId') || ''),
                notes: String(formData.get('notes') || ''),
              };
              await handleCreate(values);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Candidate</label>
              <CandidateSelect
                value={createCandidate?.id}
                onChange={(candidate: CandidateOption | null) => setCreateCandidate(candidate)}
              />
              {createCandidate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {createCandidate.candidateName} &mdash; {createCandidate.candidateEmail}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
              <Textarea name="notes" rows={4} placeholder="Add request context or onboarding notes" />
            </div>
            <DialogFooter>
              <Button type="submit">Submit request</Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(approvalDialog)} onOpenChange={(value) => { if (!value) setApprovalDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalDialog?.type === 'approve' ? 'Approve request' : 'Reject request'}</DialogTitle>
            <DialogDescription>
              Confirm this action and optionally add a note for the candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={actionComment}
              onChange={(event) => setActionComment(event.target.value)}
              rows={4}
              placeholder="Add a comment"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleApprovalAction}>
              {approvalDialog?.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
            <Button variant="outline" onClick={() => setApprovalDialog(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete ID request</AlertDialogTitle>
            <AlertDialogDescription>
              This will finalize the ID request and mark it as completed for downstream provisioning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>Complete request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
