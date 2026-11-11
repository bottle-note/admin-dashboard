import { Wine } from 'lucide-react';
import type { AlcoholMergeWhisky } from '@/types/api';

export function WhiskyMergeIdentity({ whisky }: { whisky: AlcoholMergeWhisky }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
        {whisky.imageUrl ? (
          <img src={whisky.imageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <Wine className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 space-y-1 [overflow-wrap:anywhere]">
        <p className="text-sm font-semibold">{whisky.korName}</p>
        <p className="text-xs text-muted-foreground">{whisky.engName}</p>
        <p className="font-mono text-xs text-muted-foreground">#{whisky.alcoholId}</p>
      </div>
    </div>
  );
}
