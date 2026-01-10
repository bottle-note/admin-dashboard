/**
 * 사이드바 컴포넌트 (데스크탑)
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useSidebarStore } from '@/stores/sidebar';
import { menuConfig } from '@/config/menu.config';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapse = useSidebarStore((state) => state.toggleCollapse);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex h-full flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* Collapse Toggle Button */}
        <div className="flex h-12 items-center justify-end border-b px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            </span>
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {menuConfig.map((group) =>
              group.items.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              ))
            )}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
