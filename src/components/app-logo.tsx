import { Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Workflow className="h-6 w-6 text-primary" />
      <span className="font-semibold text-lg">AgileFlow</span>
    </div>
  );
}
