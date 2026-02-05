# Curation Admin Feature - Specification

## Overview
큐레이션 관리 기능 구현 - 위스키 컬렉션 관리를 위한 어드민 CRUD 기능

## File Structure

```
src/
├── types/api/
│   └── curation.api.ts              # API 타입 정의
├── services/
│   └── curation.service.ts          # API 서비스 레이어
├── hooks/
│   └── useCurations.ts              # TanStack Query 훅
├── pages/curations/
│   ├── CurationList.tsx             # 목록 페이지
│   ├── CurationDetail.tsx           # 상세/수정 페이지
│   ├── curation.schema.ts           # Zod 폼 스키마
│   └── useCurationDetailForm.ts     # 폼 관리 훅
├── config/
│   └── menu.config.ts               # 메뉴 설정 업데이트
└── routes/
    └── index.tsx                    # 라우트 업데이트
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /admin/api/v1/curations | 목록 조회 (검색, 필터, 페이지네이션) |
| GET | /admin/api/v1/curations/{id} | 상세 조회 |
| POST | /admin/api/v1/curations | 생성 |
| PUT | /admin/api/v1/curations/{id} | 수정 |
| DELETE | /admin/api/v1/curations/{id} | 삭제 |
| PATCH | /admin/api/v1/curations/{id}/status | 상태 토글 |
| PATCH | /admin/api/v1/curations/{id}/display-order | 순서 변경 |
| POST | /admin/api/v1/curations/{id}/alcohols | 위스키 추가 |
| DELETE | /admin/api/v1/curations/{id}/alcohols/{alcoholId} | 위스키 제거 |

## Implementation Tasks

### Task 1: API Types (curation.api.ts)
- Endpoint 상수 정의
- CurationApiTypes 인터페이스
- Helper 타입 export
- types/api/index.ts 업데이트

### Task 2: Service Layer (curation.service.ts)
- Query keys 정의 (createQueryKeys)
- Mock 데이터 구현
- 모든 API 함수 구현

### Task 3: Hooks (useCurations.ts)
- useCurationList
- useCurationDetail
- useCurationCreate
- useCurationUpdate
- useCurationDelete
- useCurationToggleStatus
- useCurationAddAlcohols
- useCurationRemoveAlcohol

### Task 4: Form Schema (curation.schema.ts)
- Zod 스키마 정의
- 기본값 상수

### Task 5: Form Hook (useCurationDetailForm.ts)
- 폼 상태 관리
- 생성/수정 모드 처리
- 위스키 선택 관리

### Task 6: List Page (CurationList.tsx)
- URL 기반 검색/필터/페이지네이션
- 테이블 렌더링
- 상태 토글 스위치
- 삭제 확인 다이얼로그

### Task 7: Detail Page (CurationDetail.tsx)
- 기본 정보 폼
- 커버 이미지 업로드
- 위스키 선택/관리 UI
- 생성/수정 모드 분기

### Task 8: Routes & Menu
- routes/index.tsx 업데이트
- menu.config.ts 업데이트

## Patterns to Follow
- Banner: BannerList.tsx, BannerDetail.tsx, useBanners.ts
- TastingTag: tasting-tag.api.ts, useTastingTags.ts
- WhiskySearchSelect: 기존 컴포넌트 재사용

## Acceptance Criteria
- [ ] 목록 페이지: 검색, 필터, 페이지네이션 동작
- [ ] 상세 페이지: 생성/수정/삭제 동작
- [ ] 위스키 선택: 추가/제거 동작
- [ ] 상태 토글: 목록에서 빠른 토글 동작
- [ ] 메뉴: 사이드바에 큐레이션 메뉴 표시
- [ ] 라우트: 모든 경로 접근 가능
