# Admin Feature Specification Template

Use only sections that help reviewers make decisions. Write in Korean unless a stable technical identifier is clearer in English.

```markdown
# <Feature> Spec

## Summary

운영자가 해결하려는 문제와 이번 변경의 결과를 설명한다.

## Source Inputs

- 상위·연관 이슈
- OpenAPI 문서와 실제 응답 확인 결과
- 참고한 기존 화면과 코드

## Operator Goal

- 운영자가 답하려는 질문
- 운영자가 수행하는 핵심 흐름
- 실수했을 때 복구가 어려운 작업과 권한

## Domain Model

- 사용자에게 필요한 용어와 관계
- 원본 데이터, 현재 상태, 후보, 확정 결과의 차이
- 확인된 사실과 아직 확인하지 못한 내용

## API Contract

- 화면별 endpoint, method, query/path/body
- 필요한 response fields와 enums
- pagination과 error shape
- OpenAPI와 실제 응답의 차이

## Screen Map

| Priority | Screen | Route | Purpose | API |
| --- | --- | --- | --- | --- |

## Screen Requirements

각 화면의 표시 정보, 검색·필터, 이동, 상태, 권한, 위험 작업을 정의한다.

## State Matrix

- 최초 로딩
- 갱신 또는 다음 목록 로딩
- 전체 빈 결과
- 검색·필터 결과 없음
- 오류와 재시도
- null·부분 응답·긴 텍스트
- 권한 없음

## Acceptance Criteria

- [ ] 운영자 관점에서 관찰 가능한 완료 조건

## Delivery Slices

각 티켓이 API 레이어, 화면, 검증을 포함하는 사용 가능한 세로 흐름이 되도록 나눈다.

## In Scope

## Out of Scope

## Follow-up

## Open Questions
```
