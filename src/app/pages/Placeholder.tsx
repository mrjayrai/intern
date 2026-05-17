import { Card, CardContent } from '../components/ui/Card';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Construction className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
