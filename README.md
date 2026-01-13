# admin-dashboard
bottle note admin dashboard project


![123](https://github.com/user-attachments/assets/a6256292-33d9-4801-9b9d-78f11d9dea13)

## Prerequisites

### SOPS (Secrets OPerationS)

이 프로젝트는 환경 변수 관리를 위해 [SOPS](https://github.com/getsops/sops)를 사용합니다.

#### 설치 방법

**macOS (Homebrew)**
```bash
brew install sops
```

**Linux**
```bash
# Debian/Ubuntu
sudo apt install sops

# 또는 GitHub Releases에서 직접 다운로드
```

**Windows**
```bash
choco install sops
```

#### AWS KMS 설정

SOPS는 AWS KMS를 사용하여 암호화/복호화를 수행합니다. AWS 자격 증명이 설정되어 있어야 합니다.

```bash
# AWS CLI 설정
aws configure
```

## Setup

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정 (local)
pnpm run setup

# 환경 변수 설정 (dev)
pnpm run setup:dev

# 환경 변수 설정 (prod)
pnpm run setup:prod
```

## Development

```bash
# 로컬 개발 서버 실행
pnpm run dev:local

# dev 환경으로 실행
pnpm run dev

# prod 환경으로 실행
pnpm run dev:prod
```

## Build

```bash
# 프로덕션 빌드
pnpm run build

# dev 환경 빌드
pnpm run build:dev
```
