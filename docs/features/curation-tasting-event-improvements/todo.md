# Curation Tasting Event Improvements TODO

## Done First

- [x] 직접 입력 위스키 폼을 검색 선택 위스키 카드와 같은 입력 맥락으로 보정한다.
  - 이미지 URL 수동 입력을 이미지 업로드 방식으로 변경한다.
  - 직접 입력 위스키도 도수, 용량, 캐스크, 지역, 카테고리 메타를 입력할 수 있게 한다.

## Remaining

- [ ] 미리보기를 Figma의 앱 상세 화면 구조에 맞춰 개선한다.
  - 상단 히어로, 정보 카드, `지도 보기`, 라인업, 하단 `시음회 신청하기` CTA를 포함한다.
  - 큐레이션 내용의 개행이 미리보기에도 보이도록 한다.
- [ ] 장소 검색을 앱 리뷰 작성의 위치 추가 UX와 맞춘다.
  - 가게명 검색/선택을 지원한다.
  - 장소명, 주소, 지도 보기 노출 조건, 필요 시 좌표 payload 계약을 확인한다.
- [ ] 테이스팅 태그 직접 추가 시 `자두`, `두`처럼 분리 저장되는 원인을 추적한다.
  - 현재 프론트 직접 추가 로직은 입력값을 단일 문자열로 추가하므로 저장 API 또는 상세 hydrator 응답을 함께 확인한다.
- [ ] 평균 별점/유저 평가 공개 여부를 편집 가능하게 한다.
  - Figma 기준 노출 위치와 토글 UX를 확정한다.
  - API 확인 결과:
    - `GET /admin/api/v1/alcohols/{alcoholId}` 응답에는 `avgRating`, `totalRatingsCount`,
      `reviewCount`, `pickCount`가 있다.
    - 프론트는 DB 위스키 선택 시 위 값을 `stats.rating`, `stats.totalRatingsCount`,
      `stats.reviewCount`, `stats.totalPickCount`로 form state에 보관한다.
    - dev `WHISKY_TASTING_EVENT` curation spec의 `payload.alcohols[]`에는 현재
      `source`, `alcohol`, `comment`만 있고 `stats` 또는 stats 공개 여부 필드는 없다.
    - `additionalProperties: false`는 명시되어 있지 않으므로 프론트는 `payload.alcohols[].stats`
      additional payload를 함께 전송한다.
    - 평균 별점/유저 평가 chip을 숨긴 경우 해당 값을 `null`로 전송한다.
    - 백엔드가 스펙 외 additional payload를 저장/응답에서 보존하는지는 실제 dev 저장 후 확인이 필요하다.
