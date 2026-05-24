import { formatDistanceToNow, format } from 'date-fns';
import { AlertTriangle, ArrowRight, Clock3, CircleDot, FileCheck2, History, ShieldAlert, UserRound, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../ui/utils';
import type { ActivityFeedItem, ExtensionRequestRecord, WorkflowHistoryRecord } from '../../lib/api';

const stageIconMap = {
  completed: FileCheck2,
  in_progress: Clock3,
  pending: CircleDot,
  overdue: ShieldAlert,
  blocked: AlertTriangle,
};

const activityIconMap: Record<ActivityFeedItem['type'], typeof History> = {
  onboarding_update: History,
  approval_action: FileCheck2,
  provisioning_update: Zap,
  certificate_issued: FileCheck2,
  escalation: ShieldAlert,
  workflow_transition: ArrowRight,
  extension_request: Clock3,
};

export function SLAIndicator({
  deadline,
  compact = false,
}: {
  deadline?: string | null;
  compact?: boolean;
}) {
  if (!deadline) return <Badge variant="default">SLA not set</Badge>;

  const target = new Date(deadline);
  const diffMs = target.getTime() - Date.now();
  const overdue = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const minutes = Math.floor(absMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const label = overdue
    ? `Overdue ${days ? `${days}d ` : ''}${hours % 24}h`
    : days > 0
      ? `Due in ${days}d ${hours % 24}h`
      : hours > 0
        ? `Due in ${hours}h ${minutes % 60}m`
        : `Due in ${Math.max(0, minutes)}m`;

  return (
    <Badge variant={overdue ? 'error' : 'warning'} className={cn(compact && 'px-2 py-0.5 text-[11px]')}>
      {label}
    </Badge>
  );
}

export function WorkflowStatusBadge({
  status,
}: {
  status: WorkflowHistoryRecord['workflowStatus'] | ExtensionRequestRecord['approvalStatus'] | ActivityFeedItem['status'] | string;
}) {
  const normalized = String(status || '').toUpperCase();
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
    ACTIVE: { label: 'Active', variant: 'info' },
    DELAYED: { label: 'Delayed', variant: 'warning' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    BLOCKED: { label: 'Blocked', variant: 'error' },
    PENDING: { label: 'Pending', variant: 'warning' },
    APPROVED: { label: 'Approved', variant: 'success' },
    REJECTED: { label: 'Rejected', variant: 'error' },
    IN_PROGRESS: { label: 'In progress', variant: 'info' },
  };

  const config = map[normalized] || { label: normalized || 'Unknown', variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function EscalationBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-amber-900/80">{description}</p>
      </div>
    </div>
  );
}

export function TimelineCard({
  history,
}: {
  history: WorkflowHistoryRecord | null;
}) {
  const stages = history?.timeline ?? [];

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const Icon = stageIconMap[stage.status] || CircleDot;
        const isLast = index === stages.length - 1;
        return (
          <div key={`${stage.stage}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border',
                  stage.status === 'completed' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  stage.status === 'in_progress' && 'border-blue-200 bg-blue-50 text-blue-700',
                  stage.status === 'pending' && 'border-slate-200 bg-slate-50 text-slate-500',
                  stage.status === 'overdue' && 'border-amber-200 bg-amber-50 text-amber-700',
                  stage.status === 'blocked' && 'border-red-200 bg-red-50 text-red-700',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast ? <div className="h-full w-px bg-border" /> : null}
            </div>
            <div className="min-w-0 flex-1 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{stage.stage}</p>
                <WorkflowStatusBadge status={stage.status} />
                <SLAIndicator deadline={stage.slaDeadline} compact />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {stage.actor ? (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3 w-3" />
                    {stage.actor}
                  </span>
                ) : null}
                {stage.role ? <span>{stage.role}</span> : null}
                {stage.timestamp ? <span>{format(new Date(stage.timestamp), 'PP p')}</span> : null}
                {typeof stage.durationMinutes === 'number' ? <span>{stage.durationMinutes} min</span> : null}
              </div>
              {stage.notes ? <p className="mt-2 text-sm text-foreground/80">{stage.notes}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActivityItem({
  item,
}: {
  item: ActivityFeedItem;
}) {
  const Icon = activityIconMap[item.type];
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{item.title}</p>
          {item.status ? <WorkflowStatusBadge status={item.status} /> : null}
        </div>
        {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {item.candidateName ? <span>{item.candidateName}</span> : null}
          {item.actor ? <span>by {item.actor}</span> : null}
          <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
          {item.slaDeadline ? <SLAIndicator deadline={item.slaDeadline} compact /> : null}
        </div>
      </div>
    </div>
  );
}

export function ExtensionRequestCard({
  request,
  onApprove,
  onReject,
}: {
  request: ExtensionRequestRecord;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium">{request.reason}</p>
            <p className="text-sm text-muted-foreground">{request.requestedDays} day extension request</p>
            {request.createdAt ? <p className="mt-1 text-xs text-muted-foreground">{format(new Date(request.createdAt), 'PP p')}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkflowStatusBadge status={request.approvalStatus} />
            <Button variant="outline" size="sm" onClick={() => onReject(request._id)}>
              Reject
            </Button>
            <Button variant="primary" size="sm" onClick={() => onApprove(request._id)}>
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
