#!/bin/bash

# 버전 업데이트 스크립트
# 사용법: ./scripts/bump-version.sh [--major|--minor|--patch|--build]
# 기본값: --build

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 파일 경로
VERSION_FILE="VERSION"
PACKAGE_JSON="package.json"

# 현재 버전 읽기
if [ ! -f "$VERSION_FILE" ]; then
  echo -e "${RED}Error: VERSION 파일을 찾을 수 없습니다.${NC}"
  exit 1
fi

CURRENT_VERSION=$(cat "$VERSION_FILE" | tr -d '\n')

# 버전 파싱 (형식: major.minor.patch-build)
if [[ ! "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)-([0-9]+)$ ]]; then
  echo -e "${RED}Error: 버전 형식이 올바르지 않습니다. (예: 1.0.0-1)${NC}"
  echo "현재 버전: $CURRENT_VERSION"
  exit 1
fi

MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"
BUILD="${BASH_REMATCH[4]}"

# 기본값: build
BUMP_TYPE="build"

# 인자 파싱
while [[ $# -gt 0 ]]; do
  case $1 in
    --major)
      BUMP_TYPE="major"
      shift
      ;;
    --minor)
      BUMP_TYPE="minor"
      shift
      ;;
    --patch)
      BUMP_TYPE="patch"
      shift
      ;;
    --build)
      BUMP_TYPE="build"
      shift
      ;;
    -h|--help)
      echo "사용법: $0 [옵션]"
      echo ""
      echo "옵션:"
      echo "  --major    메이저 버전 업데이트 (1.0.0-1 -> 2.0.0-1)"
      echo "  --minor    마이너 버전 업데이트 (1.0.0-1 -> 1.1.0-1)"
      echo "  --patch    패치 버전 업데이트 (1.0.0-1 -> 1.0.1-1)"
      echo "  --build    빌드 번호 업데이트 (1.0.0-1 -> 1.0.0-2) [기본값]"
      echo "  -h, --help 도움말 표시"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: 알 수 없는 옵션: $1${NC}"
      echo "도움말: $0 --help"
      exit 1
      ;;
  esac
done

# 버전 업데이트
case $BUMP_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    BUILD=1
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    BUILD=1
    ;;
  patch)
    PATCH=$((PATCH + 1))
    BUILD=1
    ;;
  build)
    BUILD=$((BUILD + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH-$BUILD"
PACKAGE_VERSION="$MAJOR.$MINOR.$PATCH"

echo -e "${YELLOW}버전 업데이트 ($BUMP_TYPE)${NC}"
echo "----------------------------------------"
echo -e "이전 버전: ${RED}$CURRENT_VERSION${NC}"
echo -e "새 버전:   ${GREEN}$NEW_VERSION${NC}"
echo "----------------------------------------"

# VERSION 파일 업데이트
echo "$NEW_VERSION" > "$VERSION_FILE"
echo -e "${GREEN}✓${NC} VERSION 파일 업데이트 완료"

# package.json 업데이트
if [ -f "$PACKAGE_JSON" ]; then
  # jq가 있으면 사용, 없으면 sed 사용
  if command -v jq &> /dev/null; then
    tmp=$(mktemp)
    jq ".version = \"$PACKAGE_VERSION\"" "$PACKAGE_JSON" > "$tmp" && mv "$tmp" "$PACKAGE_JSON"
  else
    # sed로 version 필드 업데이트 (macOS/Linux 호환)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$PACKAGE_VERSION\"/" "$PACKAGE_JSON"
    else
      sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$PACKAGE_VERSION\"/" "$PACKAGE_JSON"
    fi
  fi
  echo -e "${GREEN}✓${NC} package.json 업데이트 완료 (version: $PACKAGE_VERSION)"
fi

echo ""
echo -e "${GREEN}버전 업데이트 완료!${NC}"
echo ""
echo "다음 단계:"
echo "  git add VERSION package.json"
echo "  git commit -m \"chore: bump version to $NEW_VERSION\""
