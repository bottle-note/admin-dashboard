ARG ENV_FILE=prod.sops.env
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat gettext
# pnpm 버전은 package.json 의 `packageManager` 필드를 corepack 이 자동 인식한다
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG ENV_FILE
WORKDIR /app

# sops 설치 (arm64/amd64 지원)
RUN apk add --no-cache curl && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi && \
    if [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; fi && \
    curl -LO https://github.com/getsops/sops/releases/download/v3.9.4/sops-v3.9.4.linux.${ARCH} && \
    mv sops-v3.9.4.linux.${ARCH} /usr/local/bin/sops && \
    chmod +x /usr/local/bin/sops

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# BuildKit secret으로 age 키를 환경변수로 주입하여 복호화
RUN --mount=type=secret,id=age_key,env=SOPS_AGE_KEY \
    sops -d ${ENV_FILE} > .env

RUN pnpm build

# 배포용 내부 API 주소는 Nginx에만 주입한다. VITE_API_BASE_URL은 로컬 Vite proxy용이다.
ARG ADMIN_API_UPSTREAM
RUN test -n "${ADMIN_API_UPSTREAM}" && \
    export API_BASE_URL="${ADMIN_API_UPSTREAM}" && \
    envsubst '${API_BASE_URL}' < nginx.conf.template > nginx.conf

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
