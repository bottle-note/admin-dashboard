# Claude Code Guidelines

이 프로젝트에서 Claude가 코드를 작성할 때 따라야 할 규칙입니다.

## 코드 스타일

### TSDoc 주석

Props interface에 주석을 달 때는 인라인 주석이 아닌 **TSDoc 형식**을 사용합니다.

```typescript
// Bad - 인라인 주석
export interface MyComponentProps {
  /** 제목 */
  title: string;
  /** 클릭 콜백 */
  onClick: () => void;
}

// Good - TSDoc 형식
/**
 * MyComponent의 props
 * @param title - 제목
 * @param onClick - 클릭 콜백
 */
export interface MyComponentProps {
  title: string;
  onClick: () => void;
}
```

### 컴포넌트 파일 구조

```typescript
/**
 * 컴포넌트 설명
 * - 주요 기능 1
 * - 주요 기능 2
 */

import { ... } from 'react';
import { ... } from '@/components/ui/...';

/**
 * Props 설명
 * @param prop1 - 설명
 * @param prop2 - 설명
 */
export interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // 구현
}
```

## 프로젝트 구조

```
src/
├── components/
│   ├── common/          # 공통 컴포넌트 (DetailPageHeader, ImageUpload, TagSelector 등)
│   ├── layout/          # 레이아웃 컴포넌트
│   └── ui/              # shadcn/ui 컴포넌트
├── pages/               # 페이지 컴포넌트
├── hooks/               # 커스텀 훅
├── services/            # API 서비스
├── stores/              # Zustand 스토어
├── types/               # TypeScript 타입 정의
└── data/mock/           # Mock 데이터
```

## 기술 스택

- React 18 + TypeScript + Vite
- React Hook Form + Zod (폼 검증)
- TanStack Query (서버 상태 관리)
- Zustand (클라이언트 상태 관리)
- Tailwind CSS + shadcn/ui (스타일링)
- React Router v7 (라우팅)
