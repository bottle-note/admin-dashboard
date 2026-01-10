/**
 * 사이드바 메뉴 아이템 컴포넌트 (재귀)
 */

import { useLocation, useNavigate } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSidebarStore } from '@/stores/sidebar';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/types/menu';

interface SidebarMenuItemProps {
  item: MenuItem;
  depth?: number;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarMenuItem({
  item,
  depth = 0,
  isCollapsed = false,
  onNavigate,
}: SidebarMenuItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const expandedMenuIds = useSidebarStore((state) => state.expandedMenuIds);
  const toggleMenu = useSidebarStore((state) => state.toggleMenu);
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);

  // 권한 체크
  if (item.roles && !hasAnyRole(item.roles)) {
    return null;
  }

  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenuIds.includes(item.id);
  const isActive = item.path ? location.pathname === item.path : false;

  // 현재 경로가 하위 메뉴에 속하는지 확인
  const isChildActive = hasChildren
    ? item.children!.some(
        (child) =>
          child.path === location.pathname ||
          (child.children &&
            child.children.some((c) => c.path === location.pathname))
      )
    : false;

  const handleClick = () => {
    if (hasChildren) {
      toggleMenu(item.id);
    } else if (item.path) {
      navigate(item.path);
      onNavigate?.();
    }
  };

  const Icon = item.icon;

  // Collapsed 상태에서 최상위 메뉴만 Tooltip으로 표시
  if (isCollapsed && depth === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive || isChildActive ? 'secondary' : 'ghost'}
            size="icon"
            className="w-full h-10"
            onClick={handleClick}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge && (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // 하위 메뉴가 있는 경우 Collapsible 사용
  if (hasChildren) {
    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleMenu(item.id)}>
        <CollapsibleTrigger asChild>
          <Button
            variant={isChildActive ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start h-10',
              depth > 0 && `pl-${depth * 4 + 4}`
            )}
            style={depth > 0 ? { paddingLeft: `${depth * 16 + 16}px` } : undefined}
          >
            {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
            <span className="flex-1 text-left truncate">{item.label}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1">
          {item.children!.map((child) => (
            <SidebarMenuItem
              key={child.id}
              item={child}
              depth={depth + 1}
              isCollapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // 일반 메뉴 아이템
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn('w-full justify-start h-10')}
      style={depth > 0 ? { paddingLeft: `${depth * 16 + 16}px` } : undefined}
      onClick={handleClick}
    >
      {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Button>
  );
}
