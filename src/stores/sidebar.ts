/**
 * 사이드바 상태 관리 스토어
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

interface SidebarState {
  /** 사이드바 접힘 상태 */
  isCollapsed: boolean;
  /** 펼쳐진 메뉴 ID 목록 */
  expandedMenuIds: string[];
  /** 모바일 사이드바 열림 상태 */
  isMobileOpen: boolean;

  // Actions
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMenu: (menuId: string) => void;
  expandMenu: (menuId: string) => void;
  collapseMenu: (menuId: string) => void;
  setMobileOpen: (open: boolean) => void;
}

// ============================================
// Store
// ============================================

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      expandedMenuIds: [],
      isMobileOpen: false,

      toggleCollapse: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          // 접힐 때 모든 메뉴 닫기
          expandedMenuIds: state.isCollapsed ? state.expandedMenuIds : [],
        })),

      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

      toggleMenu: (menuId) => {
        const { expandedMenuIds } = get();
        const isExpanded = expandedMenuIds.includes(menuId);
        set({
          expandedMenuIds: isExpanded
            ? expandedMenuIds.filter((id) => id !== menuId)
            : [...expandedMenuIds, menuId],
        });
      },

      expandMenu: (menuId) => {
        const { expandedMenuIds } = get();
        if (!expandedMenuIds.includes(menuId)) {
          set({ expandedMenuIds: [...expandedMenuIds, menuId] });
        }
      },

      collapseMenu: (menuId) =>
        set((state) => ({
          expandedMenuIds: state.expandedMenuIds.filter((id) => id !== menuId),
        })),

      setMobileOpen: (open) => set({ isMobileOpen: open }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        expandedMenuIds: state.expandedMenuIds,
      }),
    }
  )
);
