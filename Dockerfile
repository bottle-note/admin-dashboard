ARG ENV_FILE=.env
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG ENV_FILE
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ${ENV_FILE}* .env
RUN pnpm build

# Generate nginx.conf from template using env file
RUN export $(grep -v '^#' .env | xargs) && \
    envsubst '${VITE_API_BASE_URL}' < nginx.conf.template > nginx.conf

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
