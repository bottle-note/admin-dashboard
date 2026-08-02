import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';

const PREVIEW_SCREEN_WIDTH = 306;
const APP_VIEWPORT_WIDTH = 390;
const CONTENT_SCALE = PREVIEW_SCREEN_WIDTH / APP_VIEWPORT_WIDTH;
const PREVIEW_SCREEN_HEIGHT = 658;
const STATUS_BAR_HEIGHT = 34;
const APP_BAR_HEIGHT = 48;
const APP_VIEWPORT_HEIGHT = Math.round(
  (PREVIEW_SCREEN_HEIGHT - STATUS_BAR_HEIGHT - APP_BAR_HEIGHT) / CONTENT_SCALE
);

interface CurationPreviewFrameProps {
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function CurationPreviewFrame({
  title = '보틀노트',
  children,
  className,
  contentClassName,
}: CurationPreviewFrameProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[326px] rounded-[30px] border-[5px] border-[#2a2a2a] bg-[#2a2a2a] p-[5px] shadow-[0_22px_58px_rgba(15,23,42,0.32)]',
        className
      )}
      aria-label="앱 미리보기 프레임"
    >
      <div className="flex h-[658px] w-[306px] flex-col overflow-hidden rounded-[24px] bg-[#faf8f5] text-[#2d2a28]">
        <div className="flex h-[34px] shrink-0 items-center justify-between px-6 pt-2 text-[12px] font-semibold leading-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="flex h-3.5 items-end gap-[2px]">
              <span className="h-1.5 w-[3px] rounded-full bg-[#2d2a28]" />
              <span className="h-2 w-[3px] rounded-full bg-[#2d2a28]" />
              <span className="h-2.5 w-[3px] rounded-full bg-[#2d2a28]" />
              <span className="h-3 w-[3px] rounded-full bg-[#2d2a28]" />
            </span>
            <span className="relative block h-3 w-[18px] rounded-[4px] border border-[#2d2a28]">
              <span className="absolute bottom-[2px] left-[2px] top-[2px] w-[11px] rounded-[2px] bg-[#2d2a28]" />
              <span className="absolute -right-[3px] top-[3px] h-1.5 w-[2px] rounded-r-sm bg-[#2d2a28]" />
            </span>
          </div>
        </div>

        <div className="relative flex h-12 shrink-0 items-center justify-center border-b border-[#ebe6df] bg-[#faf8f5] px-5">
          <button
            type="button"
            className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full text-[#e06a5f]"
            aria-label="뒤로가기"
            tabIndex={-1}
          >
            <ChevronLeft className="h-[23px] w-[23px]" aria-hidden="true" />
          </button>
          <span className="max-w-[210px] truncate text-[15px] font-semibold text-[#2d2a28]">
            {title}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          <div
            style={{
              width: APP_VIEWPORT_WIDTH,
              height: APP_VIEWPORT_HEIGHT,
              transform: `scale(${CONTENT_SCALE})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              className={cn(
                'h-full w-full overflow-y-auto overscroll-contain bg-white',
                contentClassName
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
