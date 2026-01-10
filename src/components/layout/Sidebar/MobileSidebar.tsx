/**
 * 모바일 사이드바 (Sheet 오버레이)
 */

import { Wine } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useSidebarStore } from '@/stores/sidebar';
import { menuConfig } from '@/config/menu.config';

export function MobileSidebar() {
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  const handleNavigate = () => {
    setMobileOpen(false);
  };

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-14 flex flex-row items-center gap-2 border-b px-4">
          <Wine className="h-6 w-6 text-primary" />
          <SheetTitle className="text-lg font-semibold">
            BottleNote Admin
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-3.5rem)] py-2">
          <nav className="space-y-1 px-2">
            {menuConfig.map((group) =>
              group.items.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  item={item}
                  isCollapsed={false}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
