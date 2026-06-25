# Curation Tasting Event Improvements TODO

## Done First

- [x] 직접 입력 위스키 폼을 검색 선택 위스키 카드와 같은 입력 맥락으로 보정한다.
  - 이미지 URL 수동 입력을 이미지 업로드 방식으로 변경한다.
  - 직접 입력 위스키도 도수, 용량, 캐스크, 지역, 카테고리 메타를 입력할 수 있게 한다.
- [x] 장소 검색을 카카오 주소 검색에서 장소명 검색 UX로 전환한다.
  - Kakao Maps JavaScript SDK Places 검색을 사용한다.
  - 선택 시 주소 필드에는 도로명 주소를 우선 입력하고, 상세 주소가 비어 있으면 장소명을 채운다.
  - SDK 키는 `VITE_KAKAO_MAP_JAVASCRIPT_KEY`로 주입한다.
- [x] 장소 검색 payload 확장 계약을 확인한다.
  - 장소명, Kakao place id, 좌표, 지도 보기 노출 조건의 저장/응답 payload 계약 확인을 완료했다.
  - `placeName` 입력 필드를 추가하고 저장 payload에 함께 전송한다.
- [x] 평균 별점/유저 평가 공개 여부를 편집 가능하게 한다.
  - DB 위스키 선택 시 평균 별점/유저 평가 값을 표시한다.
  - chip의 X 버튼으로 숨긴 값은 `payload.alcohols[].stats`에 `null`로 전송한다.
- [x] 테이스팅 태그 직접 추가 시 한글 조합 중 Enter가 부분 문자열을 추가하지 않도록 한다.
  - IME 조합 중 Enter는 직접 추가로 처리하지 않는다.

## Remaining

- [x] 미리보기를 Figma의 앱 상세 화면 구조에 맞춰 개선한다.
  - 상단 히어로, 정보 카드, `지도 보기`, 라인업, 하단 `시음회 신청하기` CTA를 포함한다.
  - 큐레이션 내용의 개행이 미리보기에도 보이도록 한다.
