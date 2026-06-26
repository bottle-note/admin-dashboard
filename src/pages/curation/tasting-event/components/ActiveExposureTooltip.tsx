import { Info } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ActiveExposureTooltip() {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="활성화 상태 안내"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-72 leading-5">
          활성화 상태로 저장하면 노출기간 내에서 앱 노출 대상이 됩니다. 비활성화하면 노출기간과
          관계없이 앱에 노출되지 않습니다.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
