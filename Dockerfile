ARG ENV_FILE=prod.sops.env
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat gettext
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
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

# BuildKit secret으로 age 키를 받아 복호화
RUN --mount=type=secret,id=age_key \
    SOPS_AGE_KEY_FILE=/run/secrets/age_key \
    sops -d ${ENV_FILE} > .env

RUN pnpm build

# nginx 설정 생성
RUN export $(grep -v '^#' .env | xargs) && \
    export API_BASE_URL="${VITE_API_BASE_URL}" && \
    envsubst '${API_BASE_URL}' < nginx.conf.template > nginx.conf

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
