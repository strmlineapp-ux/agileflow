
import { Badge } from '@/components/ui/badge';
import { cn, getContrastColor } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { GoogleSymbol } from '../icons/google-symbol';

export function PriorityBadge({ priorityId, className }: { priorityId: string; className?: string }) {
  const { allBadges } = useUser();
  const priorityInfo = allBadges.find(b => b.id === priorityId);

  if (!priorityInfo) {
    return <Badge className={cn('bg-muted text-muted-foreground', className)}>{priorityId}</Badge>;
  }

  const textColor = getContrastColor(priorityInfo.color);

  const badgeContent = (
    <>
      {priorityInfo.icon && <GoogleSymbol name={priorityInfo.icon} className="text-sm mr-1" />}
      {priorityInfo.name}
    </>
  );

  const badge = (
    <Badge
      variant="default"
      style={{ backgroundColor: priorityInfo.color, color: textColor }}
      className={cn('border-transparent', 'gap-1', className)}
    >
      {badgeContent}
    </Badge>
  );

  if (priorityInfo.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{priorityInfo.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
