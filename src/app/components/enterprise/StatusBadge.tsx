import * as React from 'react';
import { Badge } from '../ui/Badge';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

export type StatusKey =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'FAILED';

const statusMap: Record<StatusKey, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'info'; icon: typeof CheckCircle }> = {
  PENDING: { label: 'Pending Approval', variant: 'warning', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  COMPLETED: { label: 'Completed', variant: 'success', icon: CheckCircle },
  NOT_STARTED: { label: 'Not Started', variant: 'default', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'info', icon: Clock },
  FAILED: { label: 'Failed', variant: 'destructive', icon: AlertTriangle },
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusKey;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusConfig = statusMap[status];
  const Icon = statusConfig.icon;

  return (
    <Badge  className={`gap-1 ${className || ''}`} {...props}>
      <Icon className="h-3 w-3" />
      {statusConfig.label}
    </Badge>
  );
}
