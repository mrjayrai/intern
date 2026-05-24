import { Badge } from '../ui/Badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export type ChecklistItem = {
  label: string;
  completed?: boolean;
  pending?: boolean;
  failed?: boolean;
};

interface ProvisioningChecklistProps {
  items: ChecklistItem[];
}

export function ProvisioningChecklist({ items }: ProvisioningChecklistProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      {items.map((item) => {
        const badgeVariant = item.completed ? 'success' : item.failed ? 'destructive' : 'warning';
        const Icon = item.completed ? CheckCircle : item.failed ? XCircle : Clock;
        const label = item.completed ? 'Done' : item.failed ? 'Failed' : 'Pending';

        return (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium">{item.label}</p>
            </div>
            {/* <Badge variant={badgeVariant}>{label}</Badge> */}
          </div>
        );
      })}
    </div>
  );
}
