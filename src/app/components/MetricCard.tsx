import { Card, CardContent } from './ui/Card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export function MetricCard({ title, value, change, icon: Icon, trend = 'neutral', color = 'bg-blue-500' }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {change && (
              <p className={`mt-2 text-sm ${
                trend === 'up' ? 'text-emerald-600' :
                trend === 'down' ? 'text-red-600' :
                'text-slate-600'
              }`}>
                {change}
              </p>
            )}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
