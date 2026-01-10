/**
 * 사이드바 메뉴 설정
 */

import {
  Wine,
  Tag,
  Image,
  MessageSquare,
  FileText,
  Users,
  List,
  Plus,
  LayoutDashboard,
} from 'lucide-react';
import type { MenuGroup } from '@/types/menu';

export const menuConfig: MenuGroup[] = [
  {
    id: 'dashboard',
    items: [
      {
        id: 'dashboard',
        label: '대시보드',
        icon: LayoutDashboard,
        path: '/',
      },
    ],
  },
  {
    id: 'whisky-tasting',
    items: [
      {
        id: 'whisky-tasting-menu',
        label: '위스키/테이스팅 태그',
        icon: Wine,
        children: [
          {
            id: 'whisky-management',
            label: '위스키 정보 관리',
            icon: Wine,
            children: [
              {
                id: 'whisky-list',
                label: '위스키 목록',
                icon: List,
                path: '/whisky',
              },
            ],
          },
          {
            id: 'tasting-tag-management',
            label: '테이스팅 태그 관리',
            icon: Tag,
            children: [
              {
                id: 'tasting-tag-list',
                label: '테이스팅 태그 목록',
                icon: List,
                path: '/tasting-tags',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'banner',
    items: [
      {
        id: 'banner-management',
        label: '배너 관리',
        icon: Image,
        children: [
          {
            id: 'banner-create',
            label: '배너 등록',
            icon: Plus,
            path: '/banners/new',
          },
          {
            id: 'banner-list',
            label: '배너 조회',
            icon: List,
            path: '/banners',
          },
        ],
      },
    ],
  },
  {
    id: 'inquiry',
    items: [
      {
        id: 'inquiry-management',
        label: '문의 관리',
        icon: MessageSquare,
        children: [
          {
            id: 'inquiry-list',
            label: '문의 목록',
            icon: List,
            path: '/inquiries',
          },
        ],
      },
    ],
  },
  {
    id: 'policy',
    items: [
      {
        id: 'policy-management',
        label: '정책/방침 관리',
        icon: FileText,
        path: '/policies',
      },
    ],
  },
  {
    id: 'user',
    items: [
      {
        id: 'user-management',
        label: '사용자 관리',
        icon: Users,
        path: '/users',
        roles: ['ROOT_ADMIN'],
      },
    ],
  },
];
