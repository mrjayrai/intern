import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeftRight, CalendarRange, RefreshCcw, Search, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, type ActivityFeedItem, type ExtensionRequestRecord, type ReferralRecord, type WorkflowHistoryRecord } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { SLAIndicator, TimelineCard, ActivityItem, EscalationBanner, WorkflowStatusBadge } from '../components/enterprise/TrackingWidgets';

type Filters = {
  stage: string;
  status: string;
  actor: string;
  dateRange: string;
};

const defaultFilters: Filters = {
  stage: 'all',
  status: 'all',
  actor: 'all',
  dateRange: '30d',
};

export function Tracking() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<ReferralRecord | null>(null);
  const [history, setHistory] = useState<WorkflowHistoryRecord | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequestRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionDays, setExtensionDays] = useState(3);
  const [submittingExtension, setSubmittingExtension] = useState(false);

  const fetchTracking = async () => {
    setError('');
    setLoadingHistory(true);
    setLoadingFeed(true);

    try {
      const referralId = selectedReferral?._id || selectedReferral?.id;
      const workflowPromise = referralId ? api.tracking.getWorkflowHistory(referralId) : Promise.resolve(null);
      const [workflowHistory, feed] = await Promise.all([
        workflowPromise,
        api.tracking.getActivityFeed({ limit: 50 }),
      ]);

      setHistory(workflowHistory);
      setActivityFeed(feed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load tracking data';
      setError(message);
      toast.error(message);
    } finally {
      setLoadingHistory(false);
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoadingReferrals(true);
    api.referrals()
      .then((data) => {
        if (!isMounted) return;
        setReferrals(data);
        setSelectedReferral((current) => current || data[0] || null);
        setLoadingReferrals(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadingReferrals(false);
        const message = err instanceof Error ? err.message : 'Unable to load referrals';
        setError(message);
        toast.error(message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedReferral) {
      fetchTracking();
    }
  }, [selectedReferral?._id, selectedReferral?.id]);

  const filteredActivity = useMemo(() => {
    const sinceMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - sinceMap[filters.dateRange]);

    return activityFeed.filter((item) => {
      // if (filters.stage !== 'all' && item.stage !== filters.stage) return false;
      const stageValue =
        typeof item.stage === 'string'
          ? item.stage
          : item.workflowStage ||
          item.stage?.label ||
          '';

      if (
        filters.stage !== 'all' &&
        stageValue !== filters.stage
      )
        return false;
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.actor !== 'all' && item.actor !== filters.actor) return false;
      return new Date(item.timestamp) >= cutoff;
    });
  }, [activityFeed, filters]);

  const actorOptions = useMemo(() => {
    return Array.from(new Set(activityFeed.map((item) => item.actor).filter(Boolean))) as string[];
  }, [activityFeed]);

  const metrics = useMemo(() => {
    const timeline = history?.timeline ?? [];
    const overdue = timeline.filter((step) => step.status === 'overdue').length;
    const blocked = timeline.filter((step) => step.status === 'blocked').length;
    const completed = timeline.filter((step) => step.status === 'completed').length;
    return {
      overdue,
      blocked,
      completed,
      totalDuration: history?.durationMinutes ?? timeline.reduce((sum, step) => sum + (step.durationMinutes || 0), 0),
    };
  }, [history]);

  const handleExtensionRequest = async () => {
    if (!extensionReason.trim()) {
      toast.error('Please add a reason for the extension request');
      return;
    }

    setSubmittingExtension(true);
    try {
      const created = await api.tracking.requestExtension({
        candidateId: selectedReferral?._id || selectedReferral?.id || '',
        reason: extensionReason.trim(),
        requestedDays: extensionDays,
      });
      setExtensionRequests((current) => [created, ...current]);
      toast.success('Extension request submitted');
      setExtensionReason('');
      setExtensionDays(3);
      setExtensionOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit extension request';
      toast.error(message);
    } finally {
      setSubmittingExtension(false);
    }
  };

  const handleExtensionDecision = async (id: string, decision: 'approve' | 'reject') => {
    try {
      const updated =
        decision === 'approve'
          ? await api.tracking.approveExtension(id, 'Approved from Tracking workspace')
          : await api.tracking.rejectExtension(id, 'Rejected from Tracking workspace');

      setExtensionRequests((current) => current.map((request) => (request._id === updated._id ? updated : request)));
      toast.success(`Extension request ${decision}d`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update extension request';
      toast.error(message);
    }
  };

  const workflowStages = history?.timeline ?? [];
  const currentStage = history?.workflowStage || workflowStages.find((stage) => stage.status === 'in_progress')?.stage || 'Unknown';
  const selectedStatus = history?.workflowStatus || 'active';
  const isLoading = loadingHistory || loadingFeed || loadingReferrals;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workflow history, SLA pressure, activity feed, and extension control in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchTracking}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setExtensionOpen(true)}>
            <Send className="h-4 w-4" />
            Request extension
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Current stage</p><p className="mt-2 text-xl font-semibold">{currentStage}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Workflow status</p><div className="mt-2"><WorkflowStatusBadge status={selectedStatus} /></div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Duration</p><p className="mt-2 text-xl font-semibold">{metrics.totalDuration ? `${Math.round(metrics.totalDuration / 60)}h` : 'N/A'}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">SLA risk</p><div className="mt-2 flex items-center gap-2"><SLAIndicator deadline={history?.slaDeadline} /><Badge variant={metrics.overdue || metrics.blocked ? 'error' : 'success'}>{metrics.overdue + metrics.blocked} flags</Badge></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Candidate workflow</CardTitle>
              <p className="text-sm text-muted-foreground">Select a candidate to load backend workflow history and activity.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {referrals.map((referral) => {
                const referralId = referral._id || referral.id || '';
                const label = referral.candidateName || 'Unnamed referral';
                return (
                  <Button key={referralId || label} variant={(selectedReferral?._id || selectedReferral?.id) === referralId ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedReferral(referral)}>
                    {label}
                  </Button>
                );
              })}
              {!referrals.length && !loadingReferrals ? (
                <span className="text-sm text-muted-foreground">No referrals available.</span>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-900">We could not load the workflow.</p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <Button className="mt-3" variant="outline" onClick={fetchTracking}>
                  Retry
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <TimelineCard history={history} />
            )}
          </div>
          <div className="space-y-4">
            {history?.bottleneck ? (
              <EscalationBanner
                title="Bottleneck detected"
                description="This workflow is sitting in a delayed stage and needs active ownership."
              />
            ) : null}
            {history?.escalationLevel && history.escalationLevel !== 'none' ? (
              <EscalationBanner
                title={`Escalation level: ${history.escalationLevel}`}
                description="SLA pressure is rising. Review the stage owner and next handoff."
              />
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Workflow summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Candidate</span><span>{selectedReferral?.candidateName || 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span>{selectedReferral?.candidateEmail || 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Started</span><span>{history?.startedAt ? format(new Date(history.startedAt), 'PP') : 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Updated</span><span>{history?.updatedAt ? format(new Date(history.updatedAt), 'PP p') : 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Current owner</span><span>{history?.currentOwner || history?.actor || 'Unassigned'}</span></div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Activity feed</CardTitle>
                <p className="text-sm text-muted-foreground">Onboarding, approvals, provisioning, certificates, escalations, and transitions.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm" value={filters.stage} onChange={(e) => setFilters((current) => ({ ...current, stage: e.target.value }))}>
                    <option value="all">All stages</option>
                    {Array.from(
                      new Set(
                        activityFeed
                          .map((item) =>
                            typeof item.stage === 'string'
                              ? item.stage
                              : item.workflowStage ||
                              item.stage?.label ||
                              ''
                          )
                          .filter(Boolean)
                      )
                    ).map((stage) => (
                      <option key={String(stage)} value={String(stage)}>
                        {String(stage)}
                      </option>
                    ))}
                  </select>
                </div>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                  <option value="delayed">Delayed</option>
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.actor} onChange={(e) => setFilters((current) => ({ ...current, actor: e.target.value }))}>
                  <option value="all">All actors</option>
                  {actorOptions.map((actor) => <option key={String(actor)} value={String(actor)}>{String(actor)}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.dateRange} onChange={(e) => setFilters((current) => ({ ...current, dateRange: e.target.value }))}>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingFeed ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredActivity.length ? (
              filteredActivity.map((item) => <ActivityItem key={item._id || item.id || `${item.title}-${item.timestamp}`} item={item} />)
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No activity matches the current filters.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{history?.slaDeadline ? format(new Date(history.slaDeadline), 'PP p') : 'No deadline set'}</p>
              </div>
              <SLAIndicator deadline={history?.slaDeadline} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600" /><span className="text-sm">Escalation indicators highlight owner handoff delays.</span></div>
              <div className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-blue-600" /><span className="text-sm">Bottleneck highlighting flags the stage blocking flow.</span></div>
              <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-slate-600" /><span className="text-sm">Workflow duration is calculated from backend stage history.</span></div>
            </div>
            <div className="rounded-lg border border-border bg-slate-50 p-4">
              <p className="text-sm font-medium">Stage status mix</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workflowStages.map((stage) => (
                  <Badge key={`${stage.stage}-${stage.status}`} variant={stage.status === 'completed' ? 'success' : stage.status === 'overdue' ? 'error' : stage.status === 'blocked' ? 'warning' : 'default'}>
                    {stage.stage}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extension requests</CardTitle>
              <p className="text-sm text-muted-foreground">Track submitted extension requests and act on approvals from the same workspace.</p>
            </div>
            <Badge variant="info">{extensionRequests.length} tracked</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {extensionRequests.length ? (
            extensionRequests.map((request) => (
              <div key={request._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{request.reason}</p>
                  <p className="text-sm text-muted-foreground">{request.requestedDays} days requested</p>
                </div>
                <div className="flex items-center gap-2">
                  <WorkflowStatusBadge status={request.approvalStatus} />
                  {request.approvalStatus === 'PENDING' ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleExtensionDecision(request._id, 'reject')}>
                        Reject
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleExtensionDecision(request._id, 'approve')}>
                        Approve
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No extension requests yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={extensionOpen} onOpenChange={setExtensionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request extension</DialogTitle>
            <DialogDescription>Submit a time extension request for the selected candidate's workflow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm">
              <p className="font-medium">{selectedReferral?.candidateName || 'Selected referral'}</p>
              <p className="text-muted-foreground">Referral {selectedReferral?._id || selectedReferral?.id || 'N/A'}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Reason</label>
              <Textarea value={extensionReason} onChange={(e) => setExtensionReason(e.target.value)} rows={4} placeholder="Explain why the workflow needs additional time" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Requested days</label>
              <Input type="number" min={1} max={30} value={extensionDays} onChange={(e) => setExtensionDays(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtensionOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExtensionRequest} disabled={submittingExtension}>
              <Sparkles className="h-4 w-4" />
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}