#!/bin/bash
# 자동 env 설정 - 필요할 때만 sync

MODE="${1:-local}"
ENV_FILE=".env.${MODE}"
[[ "$MODE" == "local" ]] && ENV_FILE=".env.local"

SUBMODULE="git.environment-variables"
SOPS_FILE="${SUBMODULE}/application.vite/${MODE}.sops.env"

# sops 없으면 경고만 하고 계속
if ! command -v sops &> /dev/null; then
    echo "⚠ sops 미설치 - env sync 건너뜀"
    exit 0
fi

# env 파일 없거나 submodule 업데이트 있으면 sync
needs_sync=false
[[ ! -f "$ENV_FILE" ]] && needs_sync=true
[[ ! -e "$SUBMODULE/.git" ]] && needs_sync=true

if [[ "$needs_sync" == false ]]; then
    cd "$SUBMODULE"
    git fetch -q origin 2>/dev/null
    LOCAL=$(git rev-parse HEAD 2>/dev/null)
    REMOTE=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/HEAD 2>/dev/null)
    cd - > /dev/null
    [[ "$LOCAL" != "$REMOTE" ]] && needs_sync=true
fi

if [[ "$needs_sync" == true ]]; then
    echo "→ env 동기화 중..."
    git submodule update --init --remote
    sops -d "$SOPS_FILE" > "$ENV_FILE"
    echo "✓ $ENV_FILE 준비 완료"
fi
