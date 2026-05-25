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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Key, CheckCircle, Clock, AlertTriangle, Shield, Search, Plus, RefreshCcw } from 'lucide-react';
import { api, getStoredUser, type AccessProvisionRecord, type AccessProvisionPayload } from '../lib/api';
import { CandidateSelect, type CandidateOption } from '../components/CandidateSelect';
import { ProvisioningChecklist } from '../components/enterprise/ProvisioningChecklist';
import { SLAIndicator } from '../components/enterprise/SLAIndicator';
import { StatusBadge } from '../components/enterprise/StatusBadge';
import { WorkflowCard } from '../components/enterprise/WorkflowCard';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

const sortOptions = [
  { value: 'slaDeadline', label: 'SLA Deadline' },
  { value: 'provisioningStatus', label: 'Status' },
  { value: 'candidateName', label: 'Candidate' },
];

type AccessFormValues = {
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  referralId?: string;
  systemAccess: string;
  notes?: string;
};

export function Access() {
  const storedUser = getStoredUser();
  const userRole = storedUser?.role;
  const canManage = userRole === 'it' || userRole === 'hr' || userRole === 'superAdmin';

  const [requests, setRequests] = useState<AccessProvisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'slaDeadline' | 'provisioningStatus' | 'candidateName'>('slaDeadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'start' | 'complete' | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const { register, handleSubmit, reset, setValue, formState } = useForm<AccessFormValues>({
    defaultValues: {
      candidateId: '',
      candidateName: '',
      candidateEmail: '',
      referralId: '',
      systemAccess: 'Active Directory, Email, VPN, Badge Access',
      notes: '',
    },
  });

  const fetchRequests = async () => {
    if (!canManage) {
      setRequests([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.access.list();
      setRequests(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load access requests';
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
        if (statusFilter !== 'all' && request.provisioningStatus !== statusFilter) return false;
        if (!normalizedSearch) return true;
        return [request.candidateName, request.candidateEmail, request.provisioningStatus]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (sortKey === 'candidateName') {
          return sortDirection === 'asc'
            ? a.candidateName.localeCompare(b.candidateName)
            : b.candidateName.localeCompare(a.candidateName);
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
    const inProgress = requests.filter((request) => request.provisioningStatus === 'IN_PROGRESS').length;
    const pending = requests.filter((request) => request.provisioningStatus === 'NOT_STARTED').length;
    const completed = requests.filter((request) => request.provisioningStatus === 'COMPLETED').length;
    const breaches = requests.filter((request) => {
      if (!request.slaDeadline) return false;
      return new Date(request.slaDeadline) < new Date() && request.provisioningStatus !== 'COMPLETED';
    }).length;
    return { total, inProgress, pending, completed, breaches };
  }, [requests]);

  const handleCreate = async (values: AccessFormValues) => {
    // RULE 2 & 4: Check for existing active provision
    const activeStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    const existingActive = requests.find(
      (req) =>
        req.candidateId === values.candidateId &&
        activeStatuses.includes(req.provisioningStatus)
    );

    if (existingActive) {
      toast.error(
        `An active Access Provision already exists for this candidate with status: ${existingActive.provisioningStatus}. ` +
        `${existingActive.provisioningStatus === 'COMPLETED' ? 'Provisioning is already completed.' : 'Please complete the existing request first.'}`
      );
      return;
    }

    const systemAccess = values.systemAccess
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: AccessProvisionPayload = {
      candidateId: values.candidateId,
      candidateName: values.candidateName,
      candidateEmail: values.candidateEmail,
      referralId: values.referralId,
      systemAccess,
      notes: values.notes,
    };

    try {
      const created = await api.access.create(payload);
      setRequests((current) => [created, ...current]);
      toast.success('Provisioning request created');
      reset();
      setIsCreateOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create provisioning request';
      toast.error(message);
    }
  };

  const getChecklist = (request: AccessProvisionRecord) => [
    { label: 'Active Directory account', completed: request.adAccountCreated },
    { label: 'Email provisioning', completed: request.emailProvisioned },
    { label: 'VPN access', completed: request.vpnAccess },
    { label: 'Badge access', completed: request.badgeAccess },
    { label: 'OTP delivered', completed: request.otpSent },
  ];

  const handleAction = async (id: string, action: 'start' | 'complete') => {
    const previous = requests;
    setRequests((current) =>
      current.map((request) =>
        request._id === id
          ? {
              ...request,
              provisioningStatus: action === 'start' ? 'IN_PROGRESS' : 'COMPLETED',
              completedAt: action === 'complete' ? new Date().toISOString() : request.completedAt,
            }
          : request,
      ),
    );

    try {
      const result = action === 'start' ? await api.access.start(id) : await api.access.complete(id);
      setRequests((current) => current.map((request) => (request._id === result._id ? result : request)));
      toast.success(`Provisioning ${action === 'start' ? 'started' : 'completed'}`);
    } catch (err) {
      setRequests(previous);
      const message = err instanceof Error ? err.message : 'Unable to update provisioning status';
      toast.error(message);
    } finally {
      setConfirmAction(null);
      setIsAlertOpen(false);
    }
  };

  const canShowEmpty = !isLoading && !error && pagedRequests.length === 0;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Provisioning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage account, email, VPN, badge, and system access provisioning.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New provisioning request
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
                <p className="text-sm text-muted-foreground">Active provisions</p>
                <p className="mt-1 text-2xl font-bold">{metrics.total}</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In progress</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{metrics.inProgress}</p>
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
                <p className="mt-1 text-2xl font-bold text-amber-600">{metrics.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
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
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1.5fr)_auto]">
            <div>
              <CardTitle>Provisioning queue</CardTitle>
              <p className="text-sm text-muted-foreground">Review active provisioning requests by SLA and status.</p>
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
                  placeholder="Search provisioning"
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
                    <option key={`${option.value}:desc`} value={`${option.value}:desc`}>
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
              <p className="font-medium text-red-900">Unable to load provisioning requests</p>
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
              <p className="text-lg font-semibold">No provisioning requests</p>
              <p className="text-sm text-muted-foreground">Create a new request to begin access provisioning for a candidate.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pagedRequests.map((request) => {
                const progressCount = getChecklist(request).filter((item) => item.completed).length;
                const progress = Math.round((progressCount / 5) * 100);

                return (
                  <Card key={request._id} className="border-border">
                    <CardContent>
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{request.candidateEmail || 'No email provided'}</p>
                          <h3 className="text-lg font-semibold">{request.candidateName}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={request.provisioningStatus} />
                          <SLAIndicator deadline={request.slaDeadline} />
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_280px]">
                        <div>
                          <ProvisioningChecklist items={getChecklist(request)} />
                        </div>
                        <div className="rounded-lg border border-border bg-slate-50 p-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Completion</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                              <p className="text-xs text-muted-foreground">System access</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {request.systemAccess.length ? (
                                  request.systemAccess.map((item) => (
                                    <Badge key={item} variant="default">
                                      {item}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">No systems assigned</span>
                                )}
                              </div>
                            </div>
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                              <p className="text-xs text-muted-foreground">Notes</p>
                              <p className="mt-2 text-sm text-slate-700">{request.notes || 'No additional notes'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                        {(request.provisioningStatus === 'NOT_STARTED' || request.provisioningStatus === 'FAILED') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setActiveRequestId(request._id);
                              setConfirmAction('start');
                              setIsAlertOpen(true);
                            }}
                          >
                            Start provisioning
                          </Button>
                        )}
                        {request.provisioningStatus === 'IN_PROGRESS' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActiveRequestId(request._id);
                              setConfirmAction('complete');
                              setIsAlertOpen(true);
                            }}
                          >
                            Complete provisioning
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => toast.success('View activity in Notifications')}>
                          View activity
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <WorkflowCard
          title="Provisioning workflow"
          steps={[
            { title: 'Request intake', status: 'completed' },
            { title: 'Account setup', status: metrics.inProgress ? 'in_progress' : 'completed' },
            { title: 'Credential delivery', status: metrics.pending ? 'pending' : 'in_progress' },
            { title: 'Ready to launch', status: metrics.completed ? 'completed' : 'pending' },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>IT operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Operational readiness</p>
              <p className="mt-2 text-lg font-semibold">Provisioning status and SLA warnings</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">Fast handoffs</p>
                  <p className="text-sm text-muted-foreground">Start provisioning with a single click and update progress in real time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Secure delivery</p>
                  <p className="text-sm text-muted-foreground">OTP, access badges, and system privileges are tracked together.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { reset(); setSelectedCandidateId(''); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New access provisioning request</DialogTitle>
            <DialogDescription>
              Create a new provisioning workflow for a candidate and assign systems.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Candidate</label>
              <CandidateSelect
                value={selectedCandidateId}
                onChange={(candidate: CandidateOption | null) => {
                  if (candidate) {
                    setSelectedCandidateId(candidate.id);
                    setValue('candidateId', candidate.id, { shouldValidate: true });
                    setValue('candidateName', candidate.candidateName, { shouldValidate: true });
                    setValue('candidateEmail', candidate.candidateEmail ?? '');
                    setValue('referralId', candidate.referralId);
                  } else {
                    setSelectedCandidateId('');
                    setValue('candidateId', '');
                    setValue('candidateName', '');
                    setValue('candidateEmail', '');
                    setValue('referralId', '');
                  }
                }}
              />
              {formState.errors.candidateName || formState.errors.candidateId ? (
                <p className="mt-1 text-xs text-red-600">Please select a candidate</p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Systems to provision</label>
              <Textarea {...register('systemAccess', { required: true })} rows={3} />
              <p className="mt-2 text-xs text-muted-foreground">Comma-separated list of systems (example: Active Directory, Email, VPN).</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
              <Textarea {...register('notes')} rows={4} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={formState.isSubmitting}>
                Submit request
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'start' ? 'Start provisioning' : 'Complete provisioning'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'start'
                ? 'Move this request into active provisioning and notify the IT team.'
                : 'Mark the provisioning workflow as complete and close the request.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeRequestId && confirmAction) {
                  handleAction(activeRequestId, confirmAction);
                }
              }}
            >
              {confirmAction === 'start' ? 'Start now' : 'Complete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
