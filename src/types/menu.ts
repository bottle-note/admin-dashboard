/**
 * 메뉴 관련 타입 정의
 */

import type { LucideIcon } from 'lucide-react';
import type { AdminRole } from './auth';

/**
 * 메뉴 아이템 타입
 */
export interface MenuItem {
  /** 고유 식별자 */
  id: string;
  /** 메뉴 라벨 */
  label: string;
  /** 메뉴 아이콘 (lucide-react) */
  icon?: LucideIcon;
  /** 클릭 시 이동할 경로 (없으면 토글 메뉴) */
  path?: string;
  /** 하위 메뉴 */
  children?: MenuItem[];
  /** 접근 가능한 역할 (없으면 모든 역할) */
  roles?: AdminRole[];
  /** 알림 배지 (optional) */
  badge?: string | number;
}

/**
 * 메뉴 그룹 타입
 */
export interface MenuGroup {
  /** 고유 식별자 */
  id: string;
  /** 그룹 제목 (선택적) */
  title?: string;
  /** 메뉴 아이템들 */
  items: MenuItem[];
}
