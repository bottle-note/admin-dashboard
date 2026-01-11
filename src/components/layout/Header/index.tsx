/**
 * 헤더 컴포넌트
 * 로고 + 사용자 메뉴
 */

import { Menu, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { useSidebarStore } from '@/stores/sidebar';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b bg-card px-4',
        className
      )}
    >
      {/* Left: Mobile menu + Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Wine className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">BottleNote Admin</span>
        </div>
      </div>

      {/* Right: User menu */}
      <UserMenu />
    </header>
  );
}
