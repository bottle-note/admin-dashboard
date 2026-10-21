import { useEffect, useState, type ReactNode } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';

export function GraphFilterPopover({
  label,
  children,
  compact = false,
  triggerClassName = '',
}: {
  label: string;
  children: ReactNode | ((close: () => void) => ReactNode);
  compact?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener('fullscreenchange', close);
    return () => document.removeEventListener('fullscreenchange', close);
  }, []);
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setContainer(
          document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : null
        );
        setOpen(next);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={`max-w-full sm:max-w-80 ${triggerClassName}`}
          title={label}
        >
          <span className="truncate">{label}</span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          aria-label={label}
          align="start"
          sideOffset={6}
          className={`attribute-workspace z-50 max-h-[min(75dvh,640px)] ${compact ? 'w-[min(360px,calc(100vw-32px))]' : 'w-[min(680px,calc(100vw-32px))]'} overflow-y-auto rounded-xl border bg-white p-5 shadow-xl`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{label}</h3>
            <PopoverPrimitive.Close asChild>
              <Button size="sm" variant="ghost" aria-label={`${label} 닫기`}>
                닫기
              </Button>
            </PopoverPrimitive.Close>
          </div>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
