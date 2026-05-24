import { Badge } from '../ui/Badge';

interface SLAIndicatorProps {
  deadline?: string | null;
}

export function SLAIndicator({ deadline }: SLAIndicatorProps) {
  if (!deadline) {
    return <Badge variant="warning">SLA not set</Badge>;
  }

  const target = new Date(deadline);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const label = isOverdue
    ? `Overdue ${days ? `${days}d ` : ''}${hours % 24}h`
    : days
    ? `Due in ${days}d ${hours % 24}h`
    : `Due in ${Math.max(0, hours)}h`;

  return <Badge variant={isOverdue ? 'error' : 'warning'}>{label}</Badge>;
}
