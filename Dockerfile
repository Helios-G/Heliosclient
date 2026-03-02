# 1단계: 빌드 스테이지
FROM node:18-alpine AS build
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 전체 소스 복사
COPY . .

# ✅ [핵심] 프로젝트 빌드 (이 명령어가 실행되어야 dist 폴더가 생깁니다)
RUN npm run build

# 2단계: 실행 스테이지 (Nginx)
FROM nginx:stable-alpine

# Nginx 설정 파일 복사 (아까 만든 default.conf)
COPY default.conf /etc/nginx/conf.d/default.conf

# ✅ 위 build 스테이지에서 생성된 'dist' 폴더 내용을 복사
# 만약 빌드 결과물이 'build' 폴더에 생긴다면 아래 경로를 /app/build로 수정하세요.
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]