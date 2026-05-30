# Curation V2 Entry Spec

## Summary

큐레이션 v2는 ROOT 관리자만 쓰는 기존 레거시 큐레이션 관리가 아니라, 바 사장님과 큐레이션 운영자도 진입할 수 있는 별도 운영 기능으로 설계한다.

첫 화면은 대시보드 하위의 단일 `큐레이션` 탭이다. 이 탭을 열면 작성 폼 안에서 타입을 탭으로 전환하는 방식이 아니라, 진입점에서 큐레이션 타입을 먼저 선택한다. 이 구조는 타입별 작성 화면이 서로 달라지고, 작성 중인 정보가 타입 전환으로 날아가는 문제를 줄이기 위한 것이다.

진입점에는 현재 구현 대상인 3개 항목만 노출한다. 노출 순서는 Figma 시안 설명 기준으로 `시음회`, `일반 큐레이션`, `페어링` 순서다.

## Source Inputs

- API docs/response shape:
  - 기존 백엔드 스펙 확인 내용은 후속 작성 화면에서 재사용한다.
  - 이번 spec은 첫 진입점 화면이 대상이므로 신규 API 호출은 요구하지 않는다.
- Existing UI/code references:
  - `src/config/menu.config.ts`: 사이드바 메뉴와 role 기반 노출 구조
  - `src/routes/index.tsx`: `RoleProtectedRoute` 라우트 보호 구조
  - `src/types/auth.ts`: 현재 사용 가능한 admin role (`ROOT_ADMIN`, `BAR_OWNER`, `COMMUNITY_MANAGER` 등)
  - `src/pages/Dashboard.tsx`: 대시보드 하위 진입 UX 참고
  - `src/index.css`, `tailwind.config.js`, `components.json`: shadcn/Tailwind 디자인 토큰
- User request:
  - 기존 플래닝은 폐기한다.
  - 대시보드 하위에 `큐레이션` 단일 탭을 추가한다.
  - 해당 탭 첫 화면은 Figma `node-id=8089-19311` 시안처럼 타입별 진입 항목을 보여준다.
  - 현재는 `시음회`, `일반 큐레이션`, `페어링` 3개 항목만 노출한다.
  - 노출 순서는 `시음회` -> `일반 큐레이션` -> `페어링`이다.
  - 각 항목의 `미리보기`를 누르면 옆 영역에 미리보기 이미지가 들어갈 예정이지만, 1차 프로토타입에서는 공간만 비워둔다.

## Admin Workflow

- 접근 가능한 관리자는 사이드바 대시보드 그룹 하위의 `큐레이션` 탭으로 진입한다.
- `큐레이션` 탭은 기존 ROOT 관리자 전용 레거시 큐레이션 관리 메뉴와 별개의 진입점이다.
- 진입 화면은 타입 선택 카드 3개와 우측 미리보기 공간으로 구성한다.
- 카드 노출 순서는 항상 `시음회`, `일반 큐레이션`, `페어링`이다.
- 관리자는 각 카드의 작성 액션을 통해 해당 타입 작성 화면으로 이동한다.
- 관리자가 카드의 `미리보기`를 누르면 우측 미리보기 영역이 해당 타입의 미리보기 대상으로 선택된다.
- 1차 구현에서는 미리보기 이미지/콘텐츠를 렌더링하지 않고 빈 공간만 유지한다.
- 작성 화면 내부에서 큐레이션 타입을 탭으로 전환하지 않는다.
- 타입을 바꾸려면 이 진입점으로 돌아와 다른 타입을 선택한다.

## Data Requirements

- 신규 진입점 자체는 서버 데이터가 필요하지 않다.
- 카드별 정적 매핑:
  - `시음회`
    - route target: `/dashboard/curations/tasting-events/new`
  - `일반 큐레이션`
    - route target: `/dashboard/curations/general/new`
  - `페어링`
    - route target: `/dashboard/curations/pairings/new`
- 큐레이션 타입의 백엔드 코드나 내부 enum 값은 이번 진입점 UI/정적 설정에 노출하지 않는다.
- 권한:
  - 1차 진입 허용 role은 `ROOT_ADMIN`, `BAR_OWNER`, `COMMUNITY_MANAGER`로 둔다.
  - 새 전용 role이 생기면 이 role 배열을 교체하거나 확장한다.

## Acceptance Criteria

- [ ] 기존 플래닝의 `/curations/spec` 중심 목록/폼 설계는 사용하지 않는다.
- [ ] 사이드바 대시보드 그룹 하위에 `큐레이션` 단일 탭이 추가된다.
- [ ] `큐레이션` 탭은 `ROOT_ADMIN`, `BAR_OWNER`, `COMMUNITY_MANAGER`가 접근할 수 있다.
- [ ] `큐레이션` 탭 첫 화면은 타입 선택 진입점이다.
- [ ] 진입점에는 `시음회`, `일반 큐레이션`, `페어링` 3개 항목만 노출된다.
- [ ] 카드 노출 순서는 `시음회`, `일반 큐레이션`, `페어링`이다.
- [ ] 각 카드에는 작성 액션과 미리보기 액션이 있다.
- [ ] 작성 액션은 타입별 작성 라우트로 이동한다.
- [ ] 미리보기 액션은 우측 미리보기 영역을 선택 상태로 만들지만, 1차에서는 이미지를 렌더링하지 않는다.
- [ ] 우측 미리보기 영역은 빈 공간으로 확보되어 후속 이미지 삽입이 가능하다.
- [ ] 작성 화면 내부에서 타입 전환 탭을 제공하지 않는다.

## In Scope

- 대시보드 하위 `큐레이션` 메뉴 추가
- 큐레이션 v2 첫 진입점 route/page 추가
- 3개 타입 선택 카드 구성
- 우측 빈 미리보기 영역 구성
- 타입별 작성 route target 정의
- 접근 role 범위 정의
- 정적 HTML 프로토타입 갱신

## Out of Scope

- 타입별 실제 작성 폼 구현
- 타입별 저장 API 연동
- 큐레이션 목록/상세/수정 화면
- 미리보기 이미지 렌더링
- 레거시 ROOT 관리자 큐레이션 관리 제거
- 새 admin role 추가

## Open Questions

- `COMMUNITY_MANAGER`가 "큐레이션 열 사람들"에 해당하는 최종 role인지 확인이 필요하다.
- `PARTNER`도 큐레이션 v2 진입 권한에 포함할지 확인이 필요하다.
- 타입별 작성 라우트 path는 구현 전 product/router naming 기준으로 최종 확정이 필요하다.
