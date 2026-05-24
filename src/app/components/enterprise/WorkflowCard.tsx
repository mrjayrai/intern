import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export type WorkflowStep = {
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'pending';
};

interface WorkflowCardProps {
  title: string;
  steps: WorkflowStep[];
}

export function WorkflowCard({ title, steps }: WorkflowCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const Icon =
            step.status === 'completed'
              ? CheckCircle
              : step.status === 'in_progress'
              ? Clock
              : AlertTriangle;

          return (
            <div key={step.title} className="flex items-start gap-3">
              <div
                className={`mt-1 flex h-10 w-10 items-center justify-center rounded-lg ${
                  step.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : step.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{step.title}</p>
                  <Badge variant={step.status === 'completed' ? 'success' : step.status === 'in_progress' ? 'info' : 'default'}>
                    {step.status.replace('_', ' ')}
                  </Badge>
                </div>
                {step.description ? <p className="text-sm text-muted-foreground">{step.description}</p> : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
